import { Pool } from 'pg';
import { NodemailerMailpitProvider } from './email/EmailProvider';
import { JobRunner } from './scheduler/JobRunner';
import { EscalationLadderHandler } from './escalation/EscalationLadderHandler';
import { HourlyInvariantsReconciler } from './reconciler/HourlyInvariantsReconciler';
import { SyntheticCanaryRunner } from './canary/SyntheticCanaryRunner';

async function bootstrap() {
  console.log('[ELDERCARE 360 WORKER] Initializing worker process...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://eldercare_app:app_secure_pass_2026@localhost:5432/eldercare_db',
    max: 10,
    idleTimeoutMillis: 30000,
  });

  const emailProvider = new NodemailerMailpitProvider();
  const jobRunner = new JobRunner(pool, emailProvider);
  const escalationHandler = new EscalationLadderHandler(pool, emailProvider);
  const reconciler = new HourlyInvariantsReconciler(pool);
  const canary = new SyntheticCanaryRunner(pool, emailProvider);

  // 1. Start Job Runner (every 15s)
  jobRunner.start(15000);

  // 2. Start Escalation Loop (every 30s)
  const escalationInterval = setInterval(async () => {
    try {
      await escalationHandler.evaluateEscalations();
    } catch (err: any) {
      console.error('[Worker Escalation Error]', err.message);
    }
  }, 30000);

  // 3. Start Synthetic Canary Probe (every 5 minutes)
  const canaryInterval = setInterval(async () => {
    try {
      await canary.runCanaryProbe();
    } catch (err: any) {
      console.error('[Worker Canary Error]', err.message);
    }
  }, 300000);

  // 4. Start Hourly Invariant Reconciler (every 60 minutes)
  const reconcilerInterval = setInterval(async () => {
    try {
      await reconciler.runHourlyAudit();
    } catch (err: any) {
      console.error('[Worker Reconciler Error]', err.message);
    }
  }, 3600000);

  console.log('[ELDERCARE 360 WORKER] All background loops active and monitoring.');

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[ELDERCARE 360 WORKER] Shutting down gracefully...');
    jobRunner.stop();
    clearInterval(escalationInterval);
    clearInterval(canaryInterval);
    clearInterval(reconcilerInterval);
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap();
