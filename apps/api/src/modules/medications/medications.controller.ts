import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { RequireAction } from '../../common/decorators/require-action.decorator';
import {
  EditRoutineTimingDto,
  ProposeMedicationChangeDto,
  ApproveMedicationChangeDto,
} from '@eldercare/contracts';

@Controller('api/v1/medications')
@UseGuards(SessionAuthGuard, PolicyGuard)
export class MedicationsController {
  constructor(private readonly medService: MedicationsService) {}

  @Get(':elderId/active')
  @RequireAction('VIEW_MEDICATIONS')
  async getActiveMedications(@Param('elderId') elderId: string) {
    return this.medService.getActiveMedications(elderId);
  }

  @Get(':elderId/discontinued')
  @RequireAction('VIEW_MEDICATIONS')
  async getDiscontinuedMedications(@Param('elderId') elderId: string) {
    return this.medService.getDiscontinuedMedications(elderId);
  }

  @Post('timing/edit')
  @RequireAction('EDIT_ROUTINE_TIMING')
  async editRoutineTiming(@Body() dto: EditRoutineTimingDto, @Req() req: any) {
    return this.medService.editRoutineTiming(dto, req.actor.id);
  }

  @Post(':elderId/propose')
  @RequireAction('PROPOSE_MEDICATION_CHANGE')
  async proposeMedicationChange(
    @Param('elderId') elderId: string,
    @Body() dto: ProposeMedicationChangeDto,
    @Req() req: any
  ) {
    return this.medService.proposeMedicationChange(dto, req.actor.id, elderId);
  }

  @Post('approve')
  @RequireAction('APPROVE_MEDICATION_CHANGE')
  async approveMedicationChange(
    @Body() dto: ApproveMedicationChangeDto,
    @Req() req: any
  ) {
    return this.medService.approveMedicationChange(dto, req.actor.id);
  }

  @Post(':id/discontinue')
  @RequireAction('APPROVE_MEDICATION_CHANGE')
  async discontinueMedication(@Param('id') id: string, @Req() req: any) {
    await this.medService.discontinueMedication(id, req.actor.id);
    return { success: true, message: 'Medication discontinued and future slots purged.' };
  }
}
