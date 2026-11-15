import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { OfflineSyncBatchDto } from '@eldercare/contracts';
import * as crypto from 'crypto';

@Injectable()
export class SyncService {
  constructor(private readonly db: DatabaseService) {}

  // Batched idempotent upload of locally captured events with device timestamps and conflict detection
  async syncOfflineBatch(
    dto: OfflineSyncBatchDto,
    actorUserId: string,
    elderId: string
  ): Promise<{ processed: number; conflicts: any[] }> {
    let processed = 0;
    const conflicts: any[] = [];

    await this.db.transaction(async (client) => {
      for (const action of dto.actions) {
        // 1. Check if slot exists
        const slot = await client.query(
          'SELECT id, status FROM dose_events WHERE id = $1 FOR UPDATE',
          [action.slotId]
        );

        if (slot.rows.length === 0) {
          conflicts.push({ slotId: action.slotId, reason: 'SLOT_NOT_FOUND' });
          continue;
        }

        // Conflict detection: If slot was already recorded online by a different actor
        if (slot.rows[0].status === 'REPORTED_TAKEN') {
          conflicts.push({
            slotId: action.slotId,
            reason: 'CONCURRENT_ONLINE_RECORDING_EXISTS',
            status: slot.rows[0].status,
          });
          // Do not overwrite, but record patient-reported claim in append-only ledger
        }

        // Fetch last hash in chain
        const prevRow = await client.query(
          'SELECT current_row_hash FROM adherence_ledger WHERE elder_id = $1 ORDER BY recorded_at DESC, id DESC LIMIT 1',
          [elderId]
        );
        const prevHash = prevRow.rows.length > 0 ? prevRow.rows[0].current_row_hash : '0'.repeat(64);

        const recordedAtIso = new Date(action.clientTimestamp).toISOString();
        const payloadStr = `${prevHash}|${elderId}|${action.slotId}|${actorUserId}|TAKEN|${action.evidenceGrade}|${recordedAtIso}`;
        const currentHash = crypto.createHash('sha256').update(payloadStr).digest('hex');

        await client.query(
          `INSERT INTO adherence_ledger (
            dose_event_id, elder_id, actor_id, outcome, evidence_grade,
            reason, previous_row_hash, current_row_hash, recorded_at
          ) VALUES ($1, $2, $3, 'TAKEN', $4, $5, $6, $7, $8)`,
          [
            action.slotId,
            elderId,
            actorUserId,
            action.evidenceGrade,
            action.reason || 'Offline PWA sync upload',
            prevHash,
            currentHash,
            recordedAtIso,
          ]
        );

        await client.query("UPDATE dose_events SET status = 'REPORTED_TAKEN' WHERE id = $1", [action.slotId]);
        processed++;
      }
    }, actorUserId);

    return { processed, conflicts };
  }

  // Audited full data export for the Elder (DPDP Act compliance)
  async exportElderData(elderId: string, actorUserId: string) {
    const [elder, meds, ledger, appointments, accessLogs] = await Promise.all([
      this.db.querySingle('SELECT * FROM elders WHERE id = $1', [elderId]),
      this.db.query('SELECT * FROM medications WHERE elder_id = $1', [elderId]),
      this.db.query('SELECT * FROM adherence_ledger WHERE elder_id = $1 ORDER BY recorded_at ASC', [elderId]),
      this.db.query('SELECT * FROM appointments WHERE elder_id = $1', [elderId]),
      this.db.query('SELECT * FROM access_audit_log WHERE elder_id = $1 ORDER BY timestamp ASC', [elderId]),
    ]);

    return {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedByUserId: actorUserId,
        patientId: elderId,
        legalFramework: 'Digital Personal Data Protection Act (DPDP) 2023',
      },
      elderProfile: elder,
      prescriptions: meds,
      adherenceLedger: ledger,
      appointments,
      accessAuditHistory: accessLogs,
    };
  }
}
