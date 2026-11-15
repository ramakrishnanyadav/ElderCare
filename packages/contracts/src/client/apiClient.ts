import {
  LoginRequest,
  ElderPinAuthRequest,
  CreateInviteRequest,
  RedeemInviteRequest,
} from '../schemas/auth';
import {
  EditRoutineTimingDto,
  ProposeMedicationChangeDto,
  ApproveMedicationChangeDto,
} from '../schemas/medications';
import {
  RecordDoseIntakeDto,
  CorrectDoseLedgerDto,
} from '../schemas/doses';
import {
  GrantConsentDto,
  RevokeConsentDto,
  EmergencyAccessRequestDto,
} from '../schemas/circle';
import {
  CreateAppointmentDto,
  CaptureVisitNotesDto,
} from '../schemas/appointments';
import {
  AcknowledgeObligationDto,
  FulfillObligationDto,
  OfflineSyncBatchDto,
} from '../schemas/obligations';

export interface EldercareApiClient {
  // Auth
  login(req: LoginRequest): Promise<{ sessionToken: string; user: any }>;
  verifyElderPin(req: ElderPinAuthRequest): Promise<{ sessionToken: string }>;
  createInvite(req: CreateInviteRequest): Promise<{ passcode: string; expiresAt: string }>;
  redeemInvite(req: RedeemInviteRequest): Promise<{ sessionToken: string }>;
  logout(): Promise<void>;

  // Medications & Schedules
  getMedications(patientId: string): Promise<any[]>;
  editRoutineTiming(dto: EditRoutineTimingDto): Promise<{ success: boolean; revertibleUntil: string }>;
  proposeMedicationChange(dto: ProposeMedicationChangeDto): Promise<{ proposalId: string; status: string }>;
  approveMedicationChange(dto: ApproveMedicationChangeDto): Promise<{ success: boolean }>;

  // Doses & Adherence
  getDoseSlots(patientId: string, fromDate?: string, toDate?: string): Promise<any[]>;
  recordDose(dto: RecordDoseIntakeDto): Promise<{ ledgerId: string; currentHash: string }>;
  correctDose(dto: CorrectDoseLedgerDto): Promise<{ ledgerId: string }>;
  getAdherenceReport(patientId: string, days?: number): Promise<any>;

  // Circle & Privacy
  getCareCircle(patientId: string): Promise<any[]>;
  grantConsent(dto: GrantConsentDto): Promise<{ consentId: string }>;
  revokeConsent(dto: RevokeConsentDto): Promise<{ success: boolean }>;
  pauseSharing(patientId: string): Promise<{ success: boolean }>;
  resumeSharing(patientId: string): Promise<{ success: boolean }>;
  requestEmergencyAccess(dto: EmergencyAccessRequestDto): Promise<{ emergencyToken: string; expiresAt: string }>;
  getAccessLedger(patientId: string): Promise<any[]>;

  // Obligations
  getObligations(patientId: string): Promise<any[]>;
  acknowledgeObligation(dto: AcknowledgeObligationDto): Promise<{ success: boolean }>;
  fulfillObligation(dto: FulfillObligationDto): Promise<{ success: boolean }>;

  // Appointments & Visit Companion
  getAppointments(patientId: string): Promise<any[]>;
  createAppointment(dto: CreateAppointmentDto): Promise<{ appointmentId: string }>;
  getVisitBrief(appointmentId: string): Promise<any>;
  saveVisitNotes(dto: CaptureVisitNotesDto): Promise<{ success: boolean }>;

  // Sync & Export
  syncOfflineBatch(dto: OfflineSyncBatchDto): Promise<{ processed: number; conflicts: any[] }>;
  exportElderData(patientId: string): Promise<any>;
}
