import { Pool } from 'pg';
import { Logger } from '@nestjs/common';
import { EmailProvider } from '../email/EmailProvider';

export class SyntheticCanaryRunner {
  private readonly logger = new Logger(SyntheticCanaryRunner.name);

  constructor(
    private readonly pool: Pool,
    private readonly emailProvider: EmailProvider
  ) {}

  async runCanaryProbe(): Promise<{ success: boolean; latencyMs: number }> {
    const startTime = Date.now();
    try {
      // 1. Dispatch synthetic probe email to Mailpit
      const res = await this.emailProvider.sendEmail({
        to: 'synthetic-canary@eldercare360.local',
        subject: 'Eldercare 360: Canary Heartbeat Probe',
        text: 'Automated synthetic canary heartbeat probe. Verifies end-to-end pipeline reachability.\n\nEldercare 360',
        html: '<p>Automated synthetic canary heartbeat probe.</p>',
      });

      const latencyMs = Date.now() - startTime;
      this.logger.log(`Synthetic canary probe verified in ${latencyMs}ms (Message ID: ${res.messageId}).`);
      return { success: true, latencyMs };
    } catch (err: any) {
      this.logger.error(`Synthetic canary probe failed: ${err.message}`);
      return { success: false, latencyMs: Date.now() - startTime };
    }
  }
}
