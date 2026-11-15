import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { PolicyGuard } from '../../common/guards/policy.guard';
import { RequireAction } from '../../common/decorators/require-action.decorator';
import { CreateAppointmentDto, CaptureVisitNotesDto } from '@eldercare/contracts';

@Controller('api/v1/appointments')
@UseGuards(SessionAuthGuard, PolicyGuard)
export class AppointmentsController {
  constructor(private readonly apptService: AppointmentsService) {}

  @Get(':elderId')
  @RequireAction('MANAGE_APPOINTMENTS')
  async getAppointments(@Param('elderId') elderId: string) {
    return this.apptService.getAppointments(elderId);
  }

  @Post()
  @RequireAction('MANAGE_APPOINTMENTS')
  async createAppointment(@Body() dto: CreateAppointmentDto, @Req() req: any) {
    return this.apptService.createAppointment(dto, req.actor.id);
  }

  @Get(':id/brief')
  @RequireAction('MANAGE_APPOINTMENTS')
  async getPreVisitBrief(@Param('id') appointmentId: string) {
    return this.apptService.getPreVisitBrief(appointmentId);
  }

  @Post('notes')
  @RequireAction('MANAGE_APPOINTMENTS')
  async saveVisitNotes(@Body() dto: CaptureVisitNotesDto, @Req() req: any) {
    await this.apptService.saveVisitNotes(dto, req.actor.id);
    return { success: true, message: 'Consultation notes recorded.' };
  }
}
