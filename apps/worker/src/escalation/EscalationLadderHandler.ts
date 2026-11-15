import { Pool } from 'pg';
import { Logger } from '@nestjs/common';
import { EmailProvider } from '../email/EmailProvider';

export class EscalationLadderHandler {
  private readonly logger = new Logger(EscalationLadderHandler.name);

  constructor(
    private readonly pool: Pool,
    private readonly emailProvider: EmailProvider
  ) {}

  async evaluateEscalations() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Identify slots that breached the clinical grace window and remain unconfirmed
      const graceBreached = await client.query(
        `UPDATE dose_events
         SET status = 'UNCONFIRMED'
         WHERE status = 'SCHEDULED' AND grace_ends_at <= NOW()
         RETURNING id, elder_id, scheduled_due_at, grace_ends_at`
      );

      for (const slot of graceBreached.rows) {
        this.logger.warn(`Slot ${slot.id} breached grace window. Transitioning to UNCONFIRMED.`);

        // Find on-call responder for patient
        const onCall = await client.query(
          `SELECT u.email, u.full_name, e.display_name
           FROM care_members cm
           JOIN users u ON cm.user_id = u.id
           JOIN elders e ON cm.elder_id = e.id
           WHERE cm.elder_id = $1 AND cm.is_on_call = TRUE`,
          [slot.elder_id]
        );

        if (onCall.rows.length > 0) {
          const responder = onCall.rows[0];
          // Dispatch Tier 2 Primary On-Call Escalation Notice
          await this.emailProvider.sendEmail({
            to: responder.email,
            subject: `Eldercare 360: A routine care event for ${responder.display_name} is unconfirmed`,
            text: `Hello ${responder.full_name},\n\nA scheduled care routine for ${responder.display_name} has not been confirmed within the grace window.\n\nAs the active on-call responder, please check in: https://app.eldercare360.in/action?slot=${slot.id}\n\nEldercare 360 Safety Ladder`,
            html: `<p>Hello ${responder.full_name},</p><p>A scheduled care routine for <strong>${responder.display_name}</strong> has not been confirmed within the grace window.</p><p><a href="https://app.eldercare360.in/action">Check In With Care Circle</a></p>`,
          });
        }
      }

      await client.query('COMMIT');
    } catch (err: any) {
      await client.query('ROLLBACK');
      this.logger.error(`Error in EscalationLadderHandler: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
