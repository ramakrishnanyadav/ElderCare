import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { EmergencyService } from './emergency.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { RequireAction } from '../../common/decorators/require-action.decorator';
import { EmergencyAccessRequestDto } from '@eldercare/contracts';

@Controller('api/v1/emergency')
@UseGuards(SessionAuthGuard, PolicyGuard)
export class EmergencyController {
  constructor(private readonly emergencyService: EmergencyService) {}

  @Post('break-glass')
  @RequireAction('INITIATE_BREAK_GLASS')
  async initiateBreakGlass(@Body() dto: EmergencyAccessRequestDto, @Req() req: any) {
    return this.emergencyService.requestBreakGlass(dto, req.actor.id);
  }
}
