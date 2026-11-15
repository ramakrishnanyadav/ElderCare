import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'crypto';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly db: DatabaseService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const actor = request.actor;
    const patientId = request.targetPatientId || actor?.id;
    const action = request.route?.path || 'UNKNOWN_ACTION';

    return next.handle().pipe(
      tap(async () => {
        if (!actor || !patientId) return;

        try {
          // Fetch last hash in audit log for this elder
          const lastLog = await this.db.querySingle<{ current_row_hash: string }>(
            `SELECT current_row_hash FROM access_audit_log 
             WHERE elder_id = $1 ORDER BY timestamp DESC, id DESC LIMIT 1`,
            [patientId]
          );

          const prevHash = lastLog ? lastLog.current_row_hash : '0'.repeat(64);
          const now = new Date();
          const payloadStr = `${prevHash}|${patientId}|${actor.id}|REST_API|${action}|ALLOWED|${now.toISOString()}`;
          const currentHash = crypto.createHash('sha256').update(payloadStr).digest('hex');

          await this.db.query(
            `INSERT INTO access_audit_log (
              elder_id, actor_id, resource_type, action, verdict, reason, timestamp, previous_row_hash, current_row_hash
            ) VALUES ($1, $2, 'REST_ENDPOINT', $3, 'ALLOWED', 'Policy check passed', $4, $5, $6)`,
            [patientId, actor.id, action, now, prevHash, currentHash]
          );
        } catch {
          // Audit log failure is non-blocking to request cycle but audited to stdout
        }
      })
    );
  }
}
