import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import {
  EditRoutineTimingDto,
  ProposeMedicationChangeDto,
  ApproveMedicationChangeDto,
} from '@eldercare/contracts';

@Injectable()
export class MedicationsService {
  constructor(private readonly db: DatabaseService) {}

  // Active medications only (Discontinued strictly excluded)
  async getActiveMedications(elderId: string) {
    return this.db.query(
      `SELECT m.id, m.brand_name, m.generic_name, mv.dosage_quantity, mv.dosage_unit,
              mv.schedule_cron, mv.instructions, mv.version_number, mv.review_status,
              inv.current_stock, inv.refill_threshold_days
       FROM medications m
       JOIN medication_versions mv ON m.current_version_id = mv.id
       LEFT JOIN inventory inv ON inv.medication_id = m.id
       WHERE m.elder_id = $1 AND m.is_active = TRUE AND m.is_discontinued = FALSE
       ORDER BY m.brand_name ASC`,
      [elderId]
    );
  }

  // Past & Discontinued medications (Isolated section)
  async getDiscontinuedMedications(elderId: string) {
    return this.db.query(
      `SELECT m.id, m.brand_name, m.generic_name, m.discontinued_date,
              mv.dosage_quantity, mv.dosage_unit, mv.instructions
       FROM medications m
       LEFT JOIN medication_versions mv ON m.current_version_id = mv.id
       WHERE m.elder_id = $1 AND m.is_discontinued = TRUE
       ORDER BY m.discontinued_date DESC`,
      [elderId]
    );
  }

  // Routine timing edit (Allows 24h undo, notifies elder)
  async editRoutineTiming(
    dto: EditRoutineTimingDto,
    actorUserId: string
  ): Promise<{ success: boolean; revertibleUntil: string }> {
    const med = await this.db.querySingle<{
      elder_id: string;
      brand_name: string;
      current_version_id: string;
      dosage_quantity: number;
      dosage_unit: string;
      instructions: string;
    }>(
      `SELECT m.elder_id, m.brand_name, m.current_version_id, mv.dosage_quantity, mv.dosage_unit, mv.instructions
       FROM medications m
       JOIN medication_versions mv ON m.current_version_id = mv.id
       WHERE m.id = $1 AND m.is_active = TRUE AND m.is_discontinued = FALSE`,
      [dto.medicationId]
    );

    if (!med) throw new NotFoundException('Active medication not found.');

    const revertibleUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h undo window

    return await this.db.transaction(async (client) => {
      // 1. Create newly incremented medication version
      const vRes = await client.query(
        `INSERT INTO medication_versions (
          medication_id, version_number, dosage_quantity, dosage_unit,
          schedule_cron, instructions, proposer_user_id, review_status, revertible_until
        )
        VALUES (
          $1,
          COALESCE((SELECT MAX(version_number) + 1 FROM medication_versions WHERE medication_id = $1), 1),
          $2, $3, $4, $5, $6, 'VERIFIED', $7
        ) RETURNING id`,
        [
          dto.medicationId,
          med.dosage_quantity,
          med.dosage_unit,
          dto.newScheduleCron,
          med.instructions,
          actorUserId,
          revertibleUntil,
        ]
      );
      const newVersionId = vRes.rows[0].id;

      // 2. Point medication to new version
      await client.query('UPDATE medications SET current_version_id = $1 WHERE id = $2', [newVersionId, dto.medicationId]);

      // 3. Regenerate future scheduled slots
      await this.db.enqueueJob(client, 'schedule_regenerator', {
        elderId: med.elder_id,
        medicationVersionId: newVersionId,
        reason: 'ROUTINE_TIMING_EDIT',
      });

      return {
        success: true,
        revertibleUntil: revertibleUntil.toISOString(),
      };
    }, actorUserId);
  }

  // Propose Medication Change (Requires verified document reference)
  async proposeMedicationChange(
    dto: ProposeMedicationChangeDto,
    proposerUserId: string,
    elderId: string
  ): Promise<{ proposalId: string; status: string }> {
    if (!dto.verifiedDocumentRef || dto.verifiedDocumentRef.trim().length === 0) {
      throw new BadRequestException('Prescription document reference is mandatory for drug or dose alterations.');
    }

    return await this.db.transaction(async (client) => {
      let medId = dto.medicationId;

      if (!medId) {
        // New medication proposal
        const mRes = await client.query(
          `INSERT INTO medications (elder_id, brand_name, generic_name, is_active)
           VALUES ($1, $2, $2, FALSE) RETURNING id`,
          [elderId, dto.brandName]
        );
        medId = mRes.rows[0].id;
      }

      // Insert unapproved provisional version
      const vRes = await client.query(
        `INSERT INTO medication_versions (
          medication_id, version_number, dosage_quantity, dosage_unit,
          schedule_cron, instructions, verified_document_ref, proposer_user_id, review_status
        )
        VALUES (
          $1,
          COALESCE((SELECT MAX(version_number) + 1 FROM medication_versions WHERE medication_id = $1), 1),
          $2, $3, $4, $5, $6, $7, 'PROVISIONAL_PENDING_APPROVAL'
        ) RETURNING id`,
        [
          medId,
          dto.proposedDosageQuantity,
          dto.proposedDosageUnit,
          dto.scheduleCron,
          dto.instructions,
          dto.verifiedDocumentRef,
          proposerUserId,
        ]
      );

      return {
        proposalId: vRes.rows[0].id,
        status: 'PROVISIONAL_PENDING_APPROVAL',
      };
    }, proposerUserId);
  }

  // Approve Medication Change (Two-person rule: Approver MUST differ from Proposer)
  async approveMedicationChange(
    dto: ApproveMedicationChangeDto,
    approverUserId: string
  ): Promise<{ success: boolean }> {
    const version = await this.db.querySingle<{
      id: string;
      medication_id: string;
      proposer_user_id: string;
      review_status: string;
    }>('SELECT * FROM medication_versions WHERE id = $1', [dto.versionId]);

    if (!version) throw new NotFoundException('Medication version not found.');

    // Two-Person Rule Enforcement
    if (version.proposer_user_id === approverUserId) {
      throw new ForbiddenException('Safety violation: Proposer cannot approve their own clinical medication modification.');
    }

    if (version.review_status !== 'PROVISIONAL_PENDING_APPROVAL') {
      throw new BadRequestException('Medication version is not awaiting approval.');
    }

    return await this.db.transaction(async (client) => {
      // 1. Mark version verified and approved
      await client.query(
        `UPDATE medication_versions 
         SET review_status = 'VERIFIED', approved_by_user_id = $1 
         WHERE id = $2`,
        [approverUserId, dto.versionId]
      );

      // 2. Promote version to current active
      await client.query(
        'UPDATE medications SET current_version_id = $1, is_active = TRUE WHERE id = $2',
        [dto.versionId, version.medication_id]
      );

      return { success: true };
    }, approverUserId);
  }

  // Discontinue medication
  async discontinueMedication(medicationId: string, actorUserId: string): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query(
        `UPDATE medications 
         SET is_active = FALSE, is_discontinued = TRUE, discontinued_date = CURRENT_DATE 
         WHERE id = $1`,
        [medicationId]
      );
      // DB trigger automatically purges future scheduled slots!
    }, actorUserId);
  }
}
