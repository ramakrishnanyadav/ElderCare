import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CreateAppointmentDto, CaptureVisitNotesDto } from '@eldercare/contracts';

@Injectable()
export class AppointmentsService {
  constructor(private readonly db: DatabaseService) {}

  async getAppointments(elderId: string) {
    return this.db.query(
      `SELECT id, doctor_name, specialty, clinic_name, scheduled_at, prep_tasks, brief_summary, status
       FROM appointments
       WHERE elder_id = $1
       ORDER BY scheduled_at ASC`,
      [elderId]
    );
  }

  async createAppointment(dto: CreateAppointmentDto, actorUserId: string) {
    const prepJson = JSON.stringify(dto.prepTasks.map((t, idx) => ({ id: `prep-${idx + 1}`, title: t, completed: false })));
    const res = await this.db.query(
      `INSERT INTO appointments (elder_id, doctor_name, specialty, clinic_name, scheduled_at, prep_tasks)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [dto.elderId, dto.doctorName, dto.specialty, dto.clinicName, new Date(dto.scheduledAt), prepJson]
    );
    return { appointmentId: res[0].id };
  }

  // Doctor Visit Companion: Pre-Visit Brief (Generated STRICTLY from verified PostgreSQL data, zero LLM)
  async getPreVisitBrief(appointmentId: string) {
    const appt = await this.db.querySingle<{
      id: string;
      elder_id: string;
      doctor_name: string;
      specialty: string;
      scheduled_at: Date;
      prep_tasks: any;
    }>('SELECT * FROM appointments WHERE id = $1', [appointmentId]);

    if (!appt) throw new NotFoundException('Appointment not found.');

    // 1. Verified Active Prescriptions
    const activeMeds = await this.db.query(
      `SELECT m.brand_name, m.generic_name, mv.dosage_quantity, mv.dosage_unit, mv.schedule_cron, mv.instructions
       FROM medications m
       JOIN medication_versions mv ON m.current_version_id = mv.id
       WHERE m.elder_id = $1 AND m.is_active = TRUE AND m.is_discontinued = FALSE`,
      [appt.elder_id]
    );

    // 2. Recent Adherence Evidence Distribution (past 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const adherenceRows = await this.db.query(
      `SELECT evidence_grade, outcome, COUNT(*) as count
       FROM adherence_ledger
       WHERE elder_id = $1 AND recorded_at >= $2 AND is_correction = FALSE
       GROUP BY evidence_grade, outcome`,
      [appt.elder_id, thirtyDaysAgo]
    );

    // 3. Exceptions in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentExceptions = await this.db.query(
      `SELECT outcome, reason, recorded_at
       FROM adherence_ledger
       WHERE elder_id = $1 AND recorded_at >= $2 AND outcome IN ('SKIPPED', 'DECLINED', 'MISSED')
       ORDER BY recorded_at DESC`,
      [appt.elder_id, sevenDaysAgo]
    );

    return {
      appointmentId: appt.id,
      patientId: appt.elder_id,
      doctorName: appt.doctor_name,
      specialty: appt.specialty,
      scheduledTime: appt.scheduled_at,
      verifiedMedications: activeMeds,
      adherenceEvidenceDistribution: adherenceRows,
      recentExceptions,
      disclaimer: 'Generated solely from verified database records. AI inference is strictly excluded.',
    };
  }

  async saveVisitNotes(dto: CaptureVisitNotesDto, actorUserId: string): Promise<void> {
    await this.db.query(
      `UPDATE appointments
       SET brief_summary = jsonb_set(brief_summary, '{consultationNotes}', $1::jsonb)
       WHERE id = $2`,
      [JSON.stringify(dto.clinicalNotes), dto.appointmentId]
    );
  }
}
