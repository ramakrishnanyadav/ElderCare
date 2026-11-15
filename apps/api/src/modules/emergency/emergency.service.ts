import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { EmergencyAccessRequestDto } from '@eldercare/contracts';

@Injectable()
export class EmergencyService {
  constructor(private readonly db: DatabaseService) {}

  async requestBreakGlass(
    dto: EmergencyAccessRequestDto,
    requesterUserId: string
  ): Promise<{ emergencyToken: string; expiresAt: string }> {
    if (!dto.reason || dto.reason.length < 10) {
      throw new BadRequestException('A valid clinical reason (min 10 chars) is mandatory for emergency access.');
    }

    const durationMinutes = Math.min(dto.durationMinutes || 60, 60); // Hard cap at 60 minutes
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

    return await this.db.transaction(async (client) => {
      // 1. Insert emergency break-glass grant
      const res = await client.query(
        `INSERT INTO emergency_access (elder_id, requester_user_id, reason, expires_at, is_active)
         VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
        [dto.elderId, requesterUserId, dto.reason, expiresAt]
      );
      const emergencyId = res.rows[0].id;

      // 2. Insert mandatory post-event review obligation for Family Admins
      await client.query(
        `INSERT INTO obligations (elder_id, owner_id, category, title, deadline_at, closure_condition, status)
         VALUES ($1, $2, 'EMERGENCY_AUDIT', 'Review Emergency Break-Glass Access Event', $3, 'Conduct post-incident review and verify emergency reason.', 'PENDING')`,
        [dto.elderId, requesterUserId, new Date(Date.now() + 24 * 60 * 60 * 1000)]
      );

      // 3. Queue high-priority zero-knowledge email notification to all circle members
      await this.db.enqueueJob(client, 'notification_dispatcher', {
        elderId: dto.elderId,
        tier: 'EMERGENCY_BREAK_GLASS_NOTICE',
        reason: 'Emergency access initiated for patient care circle.',
      });

      return {
        emergencyToken: emergencyId,
        expiresAt: expiresAt.toISOString(),
      };
    }, requesterUserId);
  }
}
