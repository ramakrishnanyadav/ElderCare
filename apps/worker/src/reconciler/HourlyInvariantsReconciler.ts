import { Pool } from 'pg';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export class HourlyInvariantsReconciler {
  private readonly logger = new Logger(HourlyInvariantsReconciler.name);

  constructor(private readonly pool: Pool) {}

  async runHourlyAudit(): Promise<{ passed: boolean; violations: string[] }> {
    this.logger.log('Executing hourly clinical safety invariant reconciliation...');
    const violations: string[] = [];

    // Invariant 1: No overlapping active medication versions
    const duplicates = await this.pool.query(
      `SELECT medication_id, COUNT(*) as active_count
       FROM medication_versions mv
       JOIN medications m ON m.current_version_id = mv.id
       WHERE m.is_active = TRUE
       GROUP BY medication_id
       HAVING COUNT(*) > 1`
    );
    if (duplicates.rows.length > 0) {
      violations.push(`INVARIANT_1_FAIL: ${duplicates.rows.length} medications have multiple active versions.`);
    }

    // Invariant 2: Every active schedule has at least 7 days materialized
    const shallowHorizons = await this.pool.query(
      `SELECT m.elder_id, m.id as medication_id, COUNT(de.id) as future_slots
       FROM medications m
       LEFT JOIN dose_events de ON de.medication_version_id = m.current_version_id AND de.scheduled_due_at > NOW()
       WHERE m.is_active = TRUE AND m.is_discontinued = FALSE
       GROUP BY m.elder_id, m.id
       HAVING COUNT(de.id) < 7`
    );
    if (shallowHorizons.rows.length > 0) {
      violations.push(`INVARIANT_2_FAIL: ${shallowHorizons.rows.length} schedules have fewer than 7 days materialized.`);
    }

    // Invariant 3: Adherence Ledger cryptographic hash continuity
    const brokenChains = await this.pool.query(
      `WITH ranked_ledger AS (
         SELECT id, elder_id, current_row_hash, previous_row_hash,
                LAG(current_row_hash) OVER (PARTITION BY elder_id ORDER BY recorded_at ASC, id ASC) as expected_prev_hash
         FROM adherence_ledger
       )
       SELECT * FROM ranked_ledger 
       WHERE expected_prev_hash IS NOT NULL AND previous_row_hash != expected_prev_hash`
    );
    if (brokenChains.rows.length > 0) {
      violations.push(`INVARIANT_3_FAIL: Critical cryptographic tamper alert! Broken hash chain detected in adherence_ledger.`);
    }

    if (violations.length > 0) {
      this.logger.error(`Clinical safety invariants breached: ${violations.join('; ')}`);
      return { passed: false, violations };
    }

    this.logger.log('All hourly invariants passed successfully.');
    return { passed: true, violations: [] };
  }
}
