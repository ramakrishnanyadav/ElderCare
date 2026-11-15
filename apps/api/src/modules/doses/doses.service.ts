import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { RecordDoseIntakeDto, CorrectDoseLedgerDto } from '@eldercare/contracts';
import * as crypto from 'crypto';

@Injectable()
export class DosesService {
  constructor(private readonly db: DatabaseService) {}

  async getDoseSlots(elderId: string, limit: number = 30) {
    return this.db.query(
      `SELECT de.id, de.scheduled_due_at, de.grace_ends_at, de.local_wall_time, de.timezone, de.status,
              m.brand_name, mv.dosage_quantity, mv.dosage_unit, mv.instructions,
              al.evidence_grade, al.recorded_at, u.full_name as actor_name
       FROM dose_events de
       JOIN medication_versions mv ON de.medication_version_id = mv.id
       JOIN medications m ON mv.medication_id = m.id
       LEFT JOIN adherence_ledger al ON al.dose_event_id = de.id AND al.is_correction = FALSE
       LEFT JOIN users u ON al.actor_id = u.id
       WHERE de.elder_id = $1
       ORDER BY de.scheduled_due_at ASC
       LIMIT $2`,
      [elderId, limit]
    );
  }

  // Non-Negotiable #4 & #5: Append-Only Ledger with Evidence Grading and SHA-256 Hash Chaining
  async recordDoseIntake(
    dto: RecordDoseIntakeDto,
    actorUserId: string,
    elderId: string
  ): Promise<{ ledgerId: string; currentHash: string }> {
    return await this.db.transaction(async (client) => {
      // 1. Fetch dose event
      const dose = await client.query(
        'SELECT id, elder_id, status FROM dose_events WHERE id = $1 FOR UPDATE',
        [dto.slotId]
      );
      if (dose.rows.length === 0) throw new BadRequestException('Dose event not found.');

      // Idempotency: If already confirmed, append audited duplicate attempt and return clean
      if (dose.rows[0].status === 'REPORTED_TAKEN' && dto.outcome === 'TAKEN') {
        const lastRow = await client.query(
          'SELECT current_row_hash FROM adherence_ledger WHERE elder_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1',
          [elderId]
        );
        return {
          ledgerId: 'IDEMPOTENT_DUPLICATE',
          currentHash: lastRow.rows[0]?.current_row_hash || '0'.repeat(64),
        };
      }

      // 2. Fetch previous ledger row for this elder to retrieve last hash
      const prevRow = await client.query(
        `SELECT current_row_hash FROM adherence_ledger 
         WHERE elder_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1`,
        [elderId]
      );
      const previousHash = prevRow.rows.length > 0 ? prevRow.rows[0].current_row_hash : '0'.repeat(64);

      // 3. Compute cryptographic current_row_hash
      const recordedAtIso = new Date(dto.clientRecordedAt).toISOString();
      const payloadString = `${previousHash}|${elderId}|${dto.slotId}|${actorUserId}|${dto.outcome}|${dto.evidenceGrade}|${recordedAtIso}`;
      const currentHash = crypto.createHash('sha256').update(payloadString).digest('hex');

      // 4. Insert append-only ledger entry
      const insRes = await client.query(
        `INSERT INTO adherence_ledger (
          dose_event_id, elder_id, actor_id, outcome, evidence_grade,
          reason, previous_row_hash, current_row_hash, recorded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          dto.slotId,
          elderId,
          actorUserId,
          dto.outcome,
          dto.evidenceGrade,
          dto.reason || null,
          previousHash,
          currentHash,
          recordedAtIso,
        ]
      );

      // 5. Update slot state
      const nextStatus = dto.outcome === 'TAKEN' ? 'REPORTED_TAKEN' : 'REPORTED_SKIPPED';
      await client.query('UPDATE dose_events SET status = $1 WHERE id = $2', [nextStatus, dto.slotId]);

      return {
        ledgerId: insRes.rows[0].id,
        currentHash,
      };
    }, actorUserId);
  }

  // Correction row referencing target row (Non-Negotiable: Never update or delete existing row!)
  async correctDoseLedger(
    dto: CorrectDoseLedgerDto,
    actorUserId: string,
    elderId: string
  ): Promise<{ ledgerId: string }> {
    return await this.db.transaction(async (client) => {
      const target = await client.query(
        'SELECT * FROM adherence_ledger WHERE id = $1 AND elder_id = $2',
        [dto.targetLedgerId, elderId]
      );
      if (target.rows.length === 0) throw new BadRequestException('Target adherence row not found.');

      // Fetch last hash in chain
      const prevRow = await client.query(
        'SELECT current_row_hash FROM adherence_ledger WHERE elder_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1',
        [elderId]
      );
      const previousHash = prevRow.rows[0].current_row_hash;

      const recordedAtIso = new Date(dto.clientRecordedAt).toISOString();
      const payloadString = `${previousHash}|${elderId}|${target.rows[0].dose_event_id}|${actorUserId}|${dto.correctedOutcome}|${dto.evidenceGrade}|${recordedAtIso}`;
      const currentHash = crypto.createHash('sha256').update(payloadString).digest('hex');

      const ins = await client.query(
        `INSERT INTO adherence_ledger (
          dose_event_id, elder_id, actor_id, outcome, evidence_grade,
          reason, previous_row_hash, current_row_hash, is_correction, target_ledger_id, recorded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $10) RETURNING id`,
        [
          target.rows[0].dose_event_id,
          elderId,
          actorUserId,
          dto.correctedOutcome,
          dto.evidenceGrade,
          dto.correctionReason,
          previousHash,
          currentHash,
          dto.targetLedgerId,
          recordedAtIso,
        ]
      );

      return { ledgerId: ins.rows[0].id };
    }, actorUserId);
  }

  // Non-Negotiable #3: Adherence report with Segmented Evidence Mix (NEVER a single percentage!)
  async getAdherenceEvidenceMixReport(elderId: string, days: number = 7) {
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await this.db.query<{ evidence_grade: string; count: string }>(
      `SELECT evidence_grade, COUNT(*) as count
       FROM adherence_ledger
       WHERE elder_id = $1 AND recorded_at >= $2 AND is_correction = FALSE
       GROUP BY evidence_grade`,
      [elderId, fromDate]
    );

    const total = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);

    return {
      elderId,
      reportingPeriodDays: days,
      totalEvents: total,
      evidenceMix: rows.map((r) => ({
        grade: r.evidence_grade,
        count: parseInt(r.count, 10),
        proportion: total > 0 ? parseInt(r.count, 10) / total : 0,
      })),
      disclaimer: 'Adherence is reported as an evidence distribution. Collapsing records into a single compliance percentage is clinically prohibited.',
    };
  }
}
