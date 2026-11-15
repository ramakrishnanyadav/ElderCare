import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CircleService } from './circle.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { RequireAction } from '../../common/decorators/require-action.decorator';
import { GrantConsentDto, RevokeConsentDto } from '@eldercare/contracts';

@Controller('api/v1/circle')
@UseGuards(SessionAuthGuard, PolicyGuard)
export class CircleController {
  constructor(private readonly circleService: CircleService) {}

  @Get(':elderId/members')
  @RequireAction('VIEW_ACCESS_LEDGER')
  async getCareCircle(@Param('elderId') elderId: string) {
    return this.circleService.getCareCircle(elderId);
  }

  @Post('consent/grant')
  @RequireAction('INVITE_MEMBER')
  async grantConsent(@Body() dto: GrantConsentDto, @Req() req: any) {
    return this.circleService.grantConsent(dto, req.actor.id);
  }

  @Post('consent/revoke')
  @RequireAction('PAUSE_SHARING')
  async revokeConsent(@Body() dto: RevokeConsentDto, @Req() req: any) {
    await this.circleService.revokeConsent(dto, req.actor.id);
    return { success: true, message: 'Consent revoked immediately.' };
  }

  @Post(':elderId/privacy/pause')
  @RequireAction('PAUSE_SHARING')
  async pauseSharing(@Param('elderId') elderId: string) {
    await this.circleService.setSharingPause(elderId, true);
    return { success: true, message: 'Data sharing paused by Elder.' };
  }

  @Post(':elderId/privacy/resume')
  @RequireAction('RESUME_SHARING')
  async resumeSharing(@Param('elderId') elderId: string) {
    await this.circleService.setSharingPause(elderId, false);
    return { success: true, message: 'Data sharing resumed.' };
  }

  @Get(':elderId/access-ledger')
  @RequireAction('VIEW_ACCESS_LEDGER')
  async getAccessLedger(@Param('elderId') elderId: string) {
    return this.circleService.getAccessLedger(elderId);
  }

  @Post(':elderId/on-call/handover')
  @RequireAction('INVITE_MEMBER')
  async handoverOnCall(
    @Param('elderId') elderId: string,
    @Body('newOnCallUserId') newUserId: string
  ) {
    await this.circleService.acknowledgeOnCallHandover(elderId, newUserId);
    return { success: true, message: 'On-call rotation handed over successfully.' };
  }
}
