export type UserRole = 'ELDER' | 'FAMILY_PRIMARY' | 'FAMILY_SECONDARY' | 'CAREGIVER';

export type ExperienceMode = 'elder' | 'family' | 'caregiver';

export type EvidenceGrade =
  | 'PATIENT_REPORTED'
  | 'CAREGIVER_WITNESSED'
  | 'CLINICIAN_RECORDED'
  | 'DEVICE_RECORDED'
  | 'UNKNOWN';

export type AdherenceStatus =
  | 'TAKEN'
  | 'DUE'
  | 'NOT_YET'
  | 'SKIPPED'
  | 'MISSED';

export interface Medicine {
  id: string;
  brandName: string;
  genericName: string;
  dosageQuantity: number;
  dosageUnit: string;
  scheduleTime: string; // e.g. "08:00"
  instructions: string; // e.g. "Before food with warm water"
  isDiscontinued: boolean;
  discontinuedDate?: string;
  stockCount: number;
  refillThresholdDays: number;
}

export interface DoseSlot {
  id: string;
  medicineId: string;
  brandName: string;
  dosageText: string;
  dueTime: string; // "08:00"
  timeCategory: 'morning' | 'afternoon' | 'evening' | 'night';
  status: AdherenceStatus;
  evidenceGrade?: EvidenceGrade;
  recordedAt?: string;
  actorName?: string;
  instructions: string;
  undoExpiresAt?: number; // timestamp for 10-min undo
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  dateTime: string; // ISO
  formattedDate: string; // "Tomorrow, 10:30 AM"
  prepTasks: { id: string; title: string; completed: boolean }[];
  briefSummary: {
    bloodPressure: string;
    keyQuestions: string[];
    verifiedMedicationsCount: number;
  };
  proposedChanges?: {
    id: string;
    medicineId?: string;
    brandName: string;
    changeType: 'DOSE_CHANGE' | 'NEW_MED' | 'DISCONTINUE';
    currentDosage?: string;
    proposedDosage: string;
    proposerName: string;
    proposerId: string;
    status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  }[];
}

export interface Obligation {
  id: string;
  title: string;
  category: 'MEDICATION_REFILL' | 'APPOINTMENT_ESCORT' | 'HEALTH_LOG';
  ownerId: string;
  ownerName: string;
  ownerRole: string;
  deadlineText: string;
  closureCondition: string;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'FULFILLED' | 'BREACHED';
}

export interface EscalationStep {
  tier: number;
  label: string;
  recipientName: string;
  channel: 'PWA_ALERT' | 'SMS_PHONE' | 'FAMILY_BROADCAST';
  status: 'SENT' | 'ACKNOWLEDGED' | 'WAITING' | 'PENDING';
  timestampText: string;
}

export interface CareCircleMember {
  id: string;
  name: string;
  relation: string;
  role: UserRole;
  isOnCall: boolean;
  ackStatus: 'ACKNOWLEDGED' | 'PENDING_ACK' | 'AVAILABLE';
  phone: string;
  initials: string;
}

export interface AccessLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  actionSummary: string; // e.g. "Rahul viewed today's medicines"
  timestampText: string;
  rawTimestamp: number;
}
