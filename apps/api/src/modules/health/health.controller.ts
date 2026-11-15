import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get('liveness')
  getLiveness() {
    return { status: 'ok', uptimeSeconds: process.uptime() };
  }

  @Get('readiness')
  async getReadiness() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ready', database: 'connected' };
    } catch (err: any) {
      return { status: 'unhealthy', error: err.message };
    }
  }

  // Patient-Safe Aggregate Metrics (Strictly Zero-PHI labels)
  @Get('metrics')
  async getMetrics() {
    const [unconfirmedDoses, deadLetters, pendingJobs] = await Promise.all([
      this.db.querySingle<{ count: string }>(
        "SELECT COUNT(*) as count FROM dose_events WHERE status = 'UNCONFIRMED'"
      ),
      this.db.querySingle<{ count: string }>(
        "SELECT COUNT(*) as count FROM jobs WHERE status = 'FAILED'"
      ),
      this.db.querySingle<{ count: string }>(
        "SELECT COUNT(*) as count FROM jobs WHERE status = 'PENDING'"
      ),
    ]);

    return {
      metrics: {
        dose_events_unconfirmed_total: parseInt(unconfirmedDoses?.count || '0', 10),
        notification_dead_letter_total: parseInt(deadLetters?.count || '0', 10),
        queue_pending_jobs_total: parseInt(pendingJobs?.count || '0', 10),
        node_memory_usage_bytes: process.memoryUsage().rss,
      },
      phiRedacted: true,
      timestamp: new Date().toISOString(),
    };
  }
}
