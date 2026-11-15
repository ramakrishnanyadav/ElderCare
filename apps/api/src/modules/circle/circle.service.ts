import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { GrantConsentDto, RevokeConsentDto } from '@eldercare/contracts';

@Injectable()
export class CircleService {
  constructor(private readonly db: DatabaseService) {}

  async getCareCircle(elderId: string) {
    return this.db.query(
      `SELECT cm.id, cm.user_id, u.full_name, u.email, u.phone_e164, cm.role, cm.status, cm.is_on_call
       FROM care_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.elder_id = $1
       ORDER BY cm.is_on_call DESC, cm.created_at ASC`,
      [elderId]
    );
  }

  async grantConsent(dto: GrantConsentDto, granterUserId: string): Promise<{ consentId: string }> {
    // Verify granter is the elder or a family admin
    const res = await this.db.query(
      `INSERT INTO consent_grants (elder_id, grantee_user_id, scope, valid_until)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [dto.elderId, dto.granteeUserId, dto.scope, dto.validUntil ? new Date(dto.validUntil) : null]
    );
    return { consentId: res[0].id };
  }

  async revokeConsent(dto: RevokeConsentDto, revokerUserId: string): Promise<void> {
    const consent = await this.db.querySingle<{ elder_id: string }>(
      'SELECT elder_id FROM consent_grants WHERE id = $1',
      [dto.consentId]
    );
    if (!consent) throw new BadRequestException('Consent grant not found.');

    await this.db.query(
      `UPDATE consent_grants 
       SET is_revoked = TRUE, revoked_at = NOW(), revocation_reason = $1 
       WHERE id = $2`,
      [dto.revocationReason, dto.consentId]
    );
  }

  // Elder Privacy Mode: Pause all non-critical sharing in one call
  async setSharingPause(elderId: string, paused: boolean): Promise<void> {
    await this.db.query(
      'UPDATE elders SET sharing_paused = $1 WHERE id = $2',
      [paused, elderId]
    );
  }

  // Plain-Language Access Ledger (Non-Negotiable: Zero health details in entries!)
  async getAccessLedger(elderId: string, limit: number = 20) {
    return this.db.query(
      `SELECT a.id, a.timestamp, u.full_name as actor_name, u.role as actor_role, a.resource_type, a.action, a.verdict, a.reason
       FROM access_audit_log a
       JOIN users u ON a.actor_id = u.id
       WHERE a.elder_id = $1
       ORDER BY a.timestamp DESC
       LIMIT $2`,
      [elderId, limit]
    );
  }

  // Two-way On-Call Handover Acknowledge
  async acknowledgeOnCallHandover(elderId: string, newOnCallUserId: string): Promise<void> {
    await this.db.transaction(async (client) => {
      // Clear existing on-call
      await client.query('UPDATE care_members SET is_on_call = FALSE WHERE elder_id = $1', [elderId]);
      // Set new on-call
      await client.query('UPDATE care_members SET is_on_call = TRUE WHERE elder_id = $1 AND user_id = $2', [elderId, newOnCallUserId]);
    });
  }
}
