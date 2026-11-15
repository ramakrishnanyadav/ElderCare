import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as crypto from 'crypto';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 1. Extract raw token from HttpOnly cookie or Authorization Bearer header
    let rawToken = request.cookies?.['eldercare_session'];
    if (!rawToken && request.headers.authorization) {
      const parts = request.headers.authorization.split(' ');
      if (parts[0] === 'Bearer' && parts[1]) {
        rawToken = parts[1];
      }
    }

    if (!rawToken) {
      throw new UnauthorizedException('Authentication required: Missing session token.');
    }

    // 2. Compute SHA-256 hash of opaque token
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 3. Query PostgreSQL for valid, unrevoked session (Instant Next-Request Revocation)
    const session = await this.db.querySingle<{
      session_id: string;
      user_id: string;
      role: string;
      expires_at: Date;
      revoked_at: Date | null;
      device_id: string | null;
      is_device_active: boolean | null;
    }>(
      `SELECT s.id as session_id, s.user_id, u.role, s.expires_at, s.revoked_at,
              s.device_id, d.is_active as is_device_active
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN devices d ON s.device_id = d.id
       WHERE s.token_hash = $1`,
      [tokenHash]
    );

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session.');
    }

    // Instant revocation check
    if (session.revoked_at || new Date(session.expires_at) < new Date()) {
      throw new UnauthorizedException('Session has been revoked or expired.');
    }

    // Device revocation check
    if (session.device_id && session.is_device_active === false) {
      throw new UnauthorizedException('Device has been revoked. All sessions terminated.');
    }

    // Non-Negotiable #1: Bind actor strictly from verified session
    request.actor = {
      id: session.user_id,
      role: session.role,
      sessionId: session.session_id,
      isDeviceBound: !!session.device_id && session.is_device_active === true,
    };

    return true;
  }
}
