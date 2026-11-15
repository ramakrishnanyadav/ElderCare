import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ObligationsService } from './obligations.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { RequireAction } from '../../common/decorators/require-action.decorator';
import { AcknowledgeObligationDto, FulfillObligationDto } from '@eldercare/contracts';

@Controller('api/v1/obligations')
@UseGuards(SessionAuthGuard, PolicyGuard)
export class ObligationsController {
  constructor(private readonly obligationsService: ObligationsService) {}

  @Get(':elderId')
  @RequireAction('VIEW_ACCESS_LEDGER')
  async getObligations(@Param('elderId') elderId: string) {
    return this.obligationsService.getObligations(elderId);
  }

  @Post('acknowledge')
  @RequireAction('RECORD_DOSE')
  async acknowledge(@Body() dto: AcknowledgeObligationDto, @Req() req: any) {
    await this.obligationsService.acknowledgeObligation(dto, req.actor.id);
    return { success: true, message: 'Obligation acknowledged.' };
  }

  @Post('fulfill')
  @RequireAction('RECORD_DOSE')
  async fulfill(@Body() dto: FulfillObligationDto, @Req() req: any) {
    await this.obligationsService.fulfillObligation(dto, req.actor.id);
    return { success: true, message: 'Obligation fulfilled with closure evidence.' };
  }
}
