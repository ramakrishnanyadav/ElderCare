import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DosesService } from './doses.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { RequireAction } from '../../common/decorators/require-action.decorator';
import { RecordDoseIntakeDto, CorrectDoseLedgerDto } from '@eldercare/contracts';

@Controller('api/v1/doses')
@UseGuards(SessionAuthGuard, PolicyGuard)
export class DosesController {
  constructor(private readonly dosesService: DosesService) {}

  @Get(':elderId/slots')
  @RequireAction('VIEW_MEDICATIONS')
  async getDoseSlots(@Param('elderId') elderId: string) {
    return this.dosesService.getDoseSlots(elderId);
  }

  @Post(':elderId/record')
  @RequireAction('RECORD_DOSE')
  async recordDoseIntake(
    @Param('elderId') elderId: string,
    @Body() dto: RecordDoseIntakeDto,
    @Req() req: any
  ) {
    return this.dosesService.recordDoseIntake(dto, req.actor.id, elderId);
  }

  @Post(':elderId/correct')
  @RequireAction('RECORD_DOSE')
  async correctDoseLedger(
    @Param('elderId') elderId: string,
    @Body() dto: CorrectDoseLedgerDto,
    @Req() req: any
  ) {
    return this.dosesService.correctDoseLedger(dto, req.actor.id, elderId);
  }

  @Get(':elderId/evidence-mix')
  @RequireAction('VIEW_MEDICATIONS')
  async getAdherenceReport(
    @Param('elderId') elderId: string,
    @Query('days') days?: string
  ) {
    return this.dosesService.getAdherenceEvidenceMixReport(
      elderId,
      days ? parseInt(days, 10) : 7
    );
  }
}
