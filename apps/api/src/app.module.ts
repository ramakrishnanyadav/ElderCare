import { Module } from '@nestjs/common';
import { DatabaseService } from './common/database/database.service';
import { SessionAuthGuard } from './common/guards/session-auth.guard';
import { PolicyGuard } from './common/guards/policy.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';

import { CircleController } from './modules/circle/circle.controller';
import { CircleService } from './modules/circle/circle.service';

import { EmergencyController } from './modules/emergency/emergency.controller';
import { EmergencyService } from './modules/emergency/emergency.service';

import { MedicationsController } from './modules/medications/medications.controller';
import { MedicationsService } from './modules/medications/medications.service';

import { DosesController } from './modules/doses/doses.controller';
import { DosesService } from './modules/doses/doses.service';

import { ObligationsController } from './modules/obligations/obligations.controller';
import { ObligationsService } from './modules/obligations/obligations.service';

import { AppointmentsController } from './modules/appointments/appointments.controller';
import { AppointmentsService } from './modules/appointments/appointments.service';

import { SyncController } from './modules/sync/sync.controller';
import { SyncService } from './modules/sync/sync.service';

import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [],
  controllers: [
    AuthController,
    CircleController,
    EmergencyController,
    MedicationsController,
    DosesController,
    ObligationsController,
    AppointmentsController,
    SyncController,
    HealthController,
  ],
  providers: [
    DatabaseService,
    SessionAuthGuard,
    PolicyGuard,
    AuditLogInterceptor,
    AuthService,
    CircleService,
    EmergencyService,
    MedicationsService,
    DosesService,
    ObligationsService,
    AppointmentsService,
    SyncService,
  ],
  exports: [DatabaseService],
})
export class AppModule {}
