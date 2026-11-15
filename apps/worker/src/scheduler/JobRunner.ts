import { Pool } from 'pg';
import { Logger } from '@nestjs/common';
import { EmailProvider } from '../email/EmailProvider';

export class JobRunner {
  private readonly logger = new Logger(JobRunner.name);
  private isRunning = false;

  constructor(
    private readonly pool: Pool,
    private readonly emailProvider: EmailProvider
  ) {}

  start(intervalMs: number = 15000) {
    this.isRunning = true;
    this.logger.log(`JobRunner scheduler started (Polling interval: ${intervalMs}ms)...`);

    const loop = async () => {
      if (!this.isRunning) return;
      try {
        await this.processNextBatch();
      } catch (err: any) {
        this.logger.error(`Error in JobRunner loop: ${err.message}`);
      }
      setTimeout(loop, intervalMs);
    };

    loop();
  }

  stop() {
    this.isRunning = false;
    this.logger.log('JobRunner scheduler stopped.');
  }

  private async processNextBatch() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Reliability constraint: FOR UPDATE SKIP LOCKED ensures no two workers double-process
      const res = await client.query(
        `SELECT id, queue_name, payload, attempts, max_attempts
         FROM jobs
         WHERE status = 'PENDING' AND run_at <= NOW()
         ORDER BY run_at ASC
         LIMIT 10
         FOR UPDATE SKIP LOCKED`
      );

      for (const job of res.rows) {
        try {
          await this.executeJob(job.queue_name, job.payload);
          await client.query("UPDATE jobs SET status = 'COMPLETED' WHERE id = $1", [job.id]);
        } catch (jobErr: any) {
          const nextAttempts = job.attempts + 1;
          if (nextAttempts >= job.max_attempts) {
            // Dead-Letter Queue
            await client.query(
              "UPDATE jobs SET status = 'FAILED', attempts = $1, last_error = $2 WHERE id = $3",
              [nextAttempts, jobErr.message, job.id]
            );
            this.logger.error(`Job ${job.id} moved to DEAD-LETTER QUEUE after ${nextAttempts} failed attempts.`);
          } else {
            // Exponential backoff with jitter: 2^attempts * 10s + random(0, 5s)
            const backoffSeconds = Math.pow(2, nextAttempts) * 10 + Math.floor(Math.random() * 5);
            const nextRunAt = new Date(Date.now() + backoffSeconds * 1000);
            await client.query(
              "UPDATE jobs SET attempts = $1, run_at = $2, last_error = $3 WHERE id = $4",
              [nextAttempts, nextRunAt, jobErr.message, job.id]
            );
          }
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private async executeJob(queueName: string, payload: any) {
    if (queueName === 'notification_dispatcher') {
      // Dispatch zero-knowledge email
      await this.emailProvider.sendEmail({
        to: payload.to || 'circle-member@example.com',
        subject: `Eldercare 360: A care event for ${payload.displayName || 'Kamala'} requires review`,
        text: `Hello,\n\nA care event scheduled for ${payload.timeIST || 'today'} is pending acknowledgement.\n\nReview securely in portal: https://app.eldercare360.in/action?ref=${payload.refCode || 'CARE-8B4F'}\n\nEldercare 360 System`,
        html: `<p>Hello,</p><p>A care event scheduled for <strong>${payload.timeIST || 'today'}</strong> is pending acknowledgement.</p><p><a href="https://app.eldercare360.in/action">Open Care Portal</a></p>`,
      });
    }
  }
}
