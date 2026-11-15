import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { RequireAction } from '../../common/decorators/require-action.decorator';
import { OfflineSyncBatchDto } from '@eldercare/contracts';

@Controller('api/v1/sync')
@UseGuards(SessionAuthGuard, PolicyGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post(':elderId/batch')
  @RequireAction('RECORD_DOSE')
  async syncOfflineBatch(
    @Param('elderId') elderId: string,
    @Body() dto: OfflineSyncBatchDto,
    @Req() req: any
  ) {
    return this.syncService.syncOfflineBatch(dto, req.actor.id, elderId);
  }

  @Get(':elderId/export')
  @RequireAction('EXPORT_DATA')
  async exportElderData(@Param('elderId') elderId: string, @Req() req: any) {
    return this.syncService.exportElderData(elderId, req.actor.id);
  }
}
