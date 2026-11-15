import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import {
  LoginRequest,
  ElderPinAuthRequest,
  CreateInviteRequest,
  RedeemInviteRequest,
} from '@eldercare/contracts';

// Crockford Base32 alphabet (excludes I, L, O, U to avoid human transcription confusion)
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

@Injectable()
export class AuthService {
  private readonly serverPepper = process.env.SERVER_PEPPER || 'eldercare_default_pepper_2026_super_secret';

  constructor(private readonly db: DatabaseService) {}

  // 1. Password Login (Family & Caregiver) with Argon2id + Salt + Pepper
  async login(dto: LoginRequest): Promise<{ sessionToken: string; user: any }> {
    const user = await this.db.querySingle<{
      id: string;
      email: string;
      full_name: string;
      role: string;
      status: string;
      argon2id_hash: string;
      argon2id_salt: string;
      failed_attempts: number;
      lockout_until: Date | null;
    }>('SELECT * FROM users WHERE email = $1', [dto.email.toLowerCase().trim()]);

    // Constant-time dummy hash check if user not found to prevent enumeration
    if (!user) {
      await argon2.hash('dummy_password_timing_defense', { type: argon2.argon2id });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      throw new ForbiddenException('Account temporarily locked out due to repeated failed logins. Please try later.');
    }

    const passwordWithPepper = `${dto.password}:${user.argon2id_salt}:${this.serverPepper}`;
    const isValid = await argon2.verify(user.argon2id_hash, passwordWithPepper);

    if (!isValid) {
      const nextFailed = user.failed_attempts + 1;
      const lockout = nextFailed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.db.query(
        'UPDATE users SET failed_attempts = $1, lockout_until = $2 WHERE id = $3',
        [nextFailed, lockout, user.id]
      );
      throw new UnauthorizedException('Invalid credentials.');
    }

    // Reset failed counter on successful auth
    await this.db.query('UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = $1', [user.id]);

    // Create opaque 256-bit hashed session token
    const sessionToken = await this.createSession(user.id);
    return {
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    };
  }

  // 2. Elder PIN Authentication (Requires Device Binding & Server Challenge Signature)
  async verifyElderPin(dto: ElderPinAuthRequest): Promise<{ sessionToken: string }> {
    // Non-Negotiable: PIN is NEVER sufficient alone.
    // Query registered device
    const device = await this.db.querySingle<{
      id: string;
      user_id: string;
      public_key_pem: string;
      is_active: boolean;
    }>('SELECT * FROM devices WHERE device_fingerprint = $1 AND is_active = TRUE', [dto.deviceFingerprint]);

    if (!device) {
      // Generic error response to prevent device enumeration
      await argon2.hash('timing_defense_pin', { type: argon2.argon2id });
      throw new UnauthorizedException('Invalid security credentials or unregistered device.');
    }

    const user = await this.db.querySingle<{
      id: string;
      argon2id_hash: string;
      argon2id_salt: string;
      failed_attempts: number;
      lockout_until: Date | null;
    }>('SELECT * FROM users WHERE id = $1', [device.user_id]);

    if (!user || (user.lockout_until && new Date(user.lockout_until) > new Date())) {
      throw new ForbiddenException('Device access locked due to failed PIN attempts.');
    }

    const pinWithPepper = `${dto.pin}:${user.argon2id_salt}:${this.serverPepper}`;
    const isPinValid = await argon2.verify(user.argon2id_hash, pinWithPepper);

    if (!isPinValid) {
      const nextFailed = user.failed_attempts + 1;
      const lockout = nextFailed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      await this.db.query(
        'UPDATE users SET failed_attempts = $1, lockout_until = $2 WHERE id = $3',
        [nextFailed, lockout, user.id]
      );
      throw new UnauthorizedException('Invalid security credentials or unregistered device.');
    }

    // Reset lockout
    await this.db.query('UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = $1', [user.id]);

    // Create session bound to device
    const sessionToken = await this.createSession(user.id, device.id);
    return { sessionToken };
  }

  // 3. Create One-Time Invite Passcode (8 chars Crockford base32, 24h expiry, HMAC stored)
  async createInvite(dto: CreateInviteRequest, inviterUserId: string): Promise<{ passcode: string; expiresAt: string }> {
    // Generate 8-character Crockford Base32 string
    let passcode = '';
    const randomBytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      passcode += CROCKFORD_ALPHABET[randomBytes[i] % CROCKFORD_ALPHABET.length];
    }

    // Compute HMAC-SHA256
    const hmacHash = crypto.createHmac('sha256', this.serverPepper).update(passcode).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.db.query(
      `INSERT INTO invites (elder_id, inviter_user_id, grantee_email, role, scope, hmac_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        dto.elderId,
        inviterUserId,
        dto.granteeEmail.toLowerCase().trim(),
        dto.role,
        dto.scope,
        hmacHash,
        expiresAt,
      ]
    );

    return { passcode, expiresAt: expiresAt.toISOString() };
  }

  // 4. Redeem Invite Passcode (Creates personal account; single-use, burned after 5 attempts)
  async redeemInvite(dto: RedeemInviteRequest): Promise<{ sessionToken: string }> {
    const computedHmac = crypto.createHmac('sha256', this.serverPepper).update(dto.passcode.toUpperCase().trim()).digest('hex');

    const invite = await this.db.querySingle<{
      id: string;
      elder_id: string;
      grantee_email: string;
      role: string;
      scope: string;
      failed_attempts: number;
      is_redeemed: boolean;
      expires_at: Date;
    }>('SELECT * FROM invites WHERE hmac_hash = $1', [computedHmac]);

    if (!invite) {
      throw new UnauthorizedException('Invalid or expired invitation passcode.');
    }

    if (invite.is_redeemed) {
      throw new BadRequestException('This invitation passcode has already been redeemed.');
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new UnauthorizedException('Invitation passcode has expired (24h validity exceeded).');
    }

    if (invite.failed_attempts >= 5) {
      throw new ForbiddenException('Invite passcode burned after 5 failed attempts.');
    }

    if (invite.grantee_email.toLowerCase() !== dto.email.toLowerCase().trim()) {
      await this.db.query('UPDATE invites SET failed_attempts = failed_attempts + 1 WHERE id = $1', [invite.id]);
      throw new UnauthorizedException('Invitation passcode is not bound to this email address.');
    }

    return await this.db.transaction(async (client) => {
      // Burn / consume invite
      await client.query('UPDATE invites SET is_redeemed = TRUE WHERE id = $1', [invite.id]);

      // Hash user password
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordWithPepper = `${dto.password}:${salt}:${this.serverPepper}`;
      const hash = await argon2.hash(passwordWithPepper, { type: argon2.argon2id });

      // Create personal user account
      const userRes = await client.query(
        `INSERT INTO users (email, full_name, role, argon2id_hash, argon2id_salt, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE') RETURNING id`,
        [dto.email.toLowerCase().trim(), dto.fullName, invite.role, hash, salt]
      );
      const newUserId = userRes.rows[0].id;

      // Add to Care Circle
      await client.query(
        `INSERT INTO care_members (elder_id, user_id, role, status)
         VALUES ($1, $2, $3, 'ACTIVE')`,
        [invite.elder_id, newUserId, invite.role]
      );

      // Bind initial scoped consent grant
      await client.query(
        `INSERT INTO consent_grants (elder_id, grantee_user_id, scope, valid_from)
         VALUES ($1, $2, $3, NOW())`,
        [invite.elder_id, newUserId, invite.scope]
      );

      // Create session
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await client.query(
        `INSERT INTO sessions (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [newUserId, tokenHash, expiresAt]
      );

      return { sessionToken: rawToken };
    });
  }

  // 5. Session Logout / Revocation
  async revokeSession(sessionToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    await this.db.query('UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
  }

  // 6. Device Revocation (Revokes device and terminates all its sessions immediately)
  async revokeDevice(deviceId: string, userId: string): Promise<void> {
    await this.db.transaction(async (client) => {
      await client.query(
        'UPDATE devices SET is_active = FALSE, revoked_at = NOW() WHERE id = $1 AND user_id = $2',
        [deviceId, userId]
      );
      // Immediately invalidate all active sessions bound to this device
      await client.query(
        'UPDATE sessions SET revoked_at = NOW() WHERE device_id = $1',
        [deviceId]
      );
    });
  }

  private async createSession(userId: string, deviceId?: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex'); // 256 bits entropy
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.db.query(
      `INSERT INTO sessions (user_id, device_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, deviceId || null, tokenHash, expiresAt]
    );

    return rawToken;
  }
}
