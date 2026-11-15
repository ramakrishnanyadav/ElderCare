import { z } from 'zod';

export const RecordDoseIntakeSchema = z.object({
  slotId: z.string().uuid(),
  outcome: z.enum(['TAKEN', 'SKIPPED', 'DECLINED']),
  evidenceGrade: z.enum([
    'PATIENT_REPORTED',
    'CAREGIVER_WITNESSED',
    'CLINICIAN_RECORDED',
    'DEVICE_RECORDED',
    'UNKNOWN',
  ]),
  reason: z.string().max(500).optional(),
  clientRecordedAt: z.string().datetime(),
}).strict();

export const CorrectDoseLedgerSchema = z.object({
  targetLedgerId: z.string().uuid(),
  correctedOutcome: z.enum(['TAKEN', 'SKIPPED', 'DECLINED']),
  evidenceGrade: z.enum([
    'PATIENT_REPORTED',
    'CAREGIVER_WITNESSED',
    'CLINICIAN_RECORDED',
    'DEVICE_RECORDED',
    'UNKNOWN',
  ]),
  correctionReason: z.string().min(5).max(500),
  clientRecordedAt: z.string().datetime(),
}).strict();

export type RecordDoseIntakeDto = z.infer<typeof RecordDoseIntakeSchema>;
export type CorrectDoseLedgerDto = z.infer<typeof CorrectDoseLedgerSchema>;
