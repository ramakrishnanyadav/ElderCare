import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import * as crypto from 'crypto';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://eldercare_app:app_secure_pass_2026@localhost:5432/eldercare_db',
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }

  async onModuleInit() {
    try {
      const client = await this.pool.connect();
      client.release();
      this.logger.log('PostgreSQL connection pool initialized successfully.');
    } catch (err: any) {
      this.logger.warn(`Initial database connection warning: ${err.message}. Ensure Docker Compose is running.`);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const res = await this.pool.query(sql, params);
    return res.rows;
  }

  async querySingle<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  // Transaction execution with RLS actor binding and transactional job enqueueing
  async transaction<T>(
    fn: (client: PoolClient) => Promise<T>,
    actorUserId?: string
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Secondary RLS layer: set app.current_user_id inside transaction
      if (actorUserId) {
        await client.query('SELECT set_config($1, $2, true)', ['app.current_user_id', actorUserId]);
      }

      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Non-Negotiable #2: Transactional job enqueueing in the SAME transaction
  async enqueueJob(
    client: PoolClient,
    queueName: string,
    payload: Record<string, any>,
    runAt: Date = new Date()
  ): Promise<string> {
    const res = await client.query(
      `INSERT INTO jobs (queue_name, payload, run_at, status)
       VALUES ($1, $2, $3, 'PENDING') RETURNING id`,
      [queueName, JSON.stringify(payload), runAt]
    );
    return res.rows[0].id;
  }

  // Cryptographic Ledger Integrity Verifier (Non-Negotiable #5)
  async verifyLedgerIntegrity(elderId: string): Promise<{ valid: boolean; totalRows: number; brokenRowId?: string }> {
    const rows = await this.query<{
      id: string;
      dose_event_id: string;
      actor_id: string;
      outcome: string;
      evidence_grade: string;
      recorded_at: Date;
      previous_row_hash: string;
      current_row_hash: string;
    }>(
      `SELECT id, dose_event_id, actor_id, outcome, evidence_grade, recorded_at, previous_row_hash, current_row_hash
       FROM adherence_ledger
       WHERE elder_id = $1
       ORDER BY recorded_at ASC, id ASC`,
      [elderId]
    );

    let expectedPrevHash = '0'.repeat(64); // Genesis

    for (const row of rows) {
      if (row.previous_row_hash !== expectedPrevHash) {
        return { valid: false, totalRows: rows.length, brokenRowId: row.id };
      }

      // Recompute expected current hash
      const payloadString = `${expectedPrevHash}|${elderId}|${row.dose_event_id}|${row.actor_id}|${row.outcome}|${row.evidence_grade}|${new Date(row.recorded_at).toISOString()}`;
      const computedHash = crypto.createHash('sha256').update(payloadString).digest('hex');

      if (row.current_row_hash !== computedHash) {
        return { valid: false, totalRows: rows.length, brokenRowId: row.id };
      }

      expectedPrevHash = row.current_row_hash;
    }

    return { valid: true, totalRows: rows.length };
  }
}
