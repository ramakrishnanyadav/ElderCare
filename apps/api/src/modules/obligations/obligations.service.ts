import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { AcknowledgeObligationDto, FulfillObligationDto } from '@eldercare/contracts';

@Injectable()
export class ObligationsService {
  constructor(private readonly db: DatabaseService) {}

  async getObligations(elderId: string) {
    return this.db.query(
      `SELECT o.id, o.category, o.title, o.deadline_at, o.closure_condition, o.status, o.closed_at,
              u.full_name as owner_name, u.role as owner_role
       FROM obligations o
       JOIN users u ON o.owner_id = u.id
       WHERE o.elder_id = $1
       ORDER BY o.deadline_at ASC`,
      [elderId]
    );
  }

  async acknowledgeObligation(dto: AcknowledgeObligationDto, actorUserId: string): Promise<void> {
    const ob = await this.db.querySingle<{ id: string; owner_id: string; status: string }>(
      'SELECT id, owner_id, status FROM obligations WHERE id = $1',
      [dto.obligationId]
    );
    if (!ob) throw new NotFoundException('Obligation not found.');

    await this.db.query(
      "UPDATE obligations SET status = 'ACKNOWLEDGED' WHERE id = $1",
      [dto.obligationId]
    );
  }

  async fulfillObligation(dto: FulfillObligationDto, actorUserId: string): Promise<void> {
    if (!dto.closureEvidence || dto.closureEvidence.length < 3) {
      throw new BadRequestException('Audited closure evidence is required to complete an obligation.');
    }

    await this.db.transaction(async (client) => {
      await client.query(
        "UPDATE obligations SET status = 'FULFILLED', closed_at = NOW() WHERE id = $1",
        [dto.obligationId]
      );
    }, actorUserId);
  }
}
