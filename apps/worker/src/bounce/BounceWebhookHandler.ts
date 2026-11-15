import { Pool } from 'pg';
import { Logger } from '@nestjs/common';

export interface BounceWebhookPayload {
  recipientEmail: string;
  eventType: 'HARD_BOUNCE' | 'COMPLAINT' | 'TRANSIENT_DELAY';
  diagnosticCode?: string;
  timestamp: string;
}

export class BounceWebhookHandler {
  private readonly logger = new Logger(BounceWebhookHandler.name);

  constructor(private readonly pool: Pool) {}

  async handleBounce(payload: BounceWebhookPayload): Promise<void> {
    this.logger.warn(`Email delivery failure webhook: ${payload.eventType} for recipient.`);

    if (payload.eventType === 'HARD_BOUNCE' || payload.eventType === 'COMPLAINT') {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        // 1. Locate user and suspend email channel
        const user = await client.query(
          'SELECT id, full_name FROM users WHERE email = $1',
          [payload.recipientEmail.toLowerCase().trim()]
        );

        if (user.rows.length > 0) {
          const userId = user.rows[0].id;
          await client.query("UPDATE users SET status = 'SUSPENDED' WHERE id = $1", [userId]);

          // 2. Identify associated elder circles and create reachability obligation
          const circles = await client.query(
            'SELECT elder_id FROM care_members WHERE user_id = $1',
            [userId]
          );

          for (const c of circles.rows) {
            await client.query(
              `INSERT INTO obligations (elder_id, owner_id, category, title, deadline_at, closure_condition, status)
               VALUES ($1, $2, 'REACHABILITY_FAILURE', 'Update Suppressed Contact Email Address', NOW() + INTERVAL '24 hours', 'Confirm valid emergency phone number or updated email address.', 'PENDING')`,
              [c.elder_id, userId]
            );
          }
        }

        await client.query('COMMIT');
      } catch (err: any) {
        await client.query('ROLLBACK');
        this.logger.error(`Error processing bounce webhook: ${err.message}`);
      } finally {
        client.release();
      }
    }
  }
}
