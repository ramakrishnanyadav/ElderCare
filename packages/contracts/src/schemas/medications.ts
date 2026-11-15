import { z } from 'zod';

export const EditRoutineTimingSchema = z.object({
  medicationId: z.string().uuid(),
  newScheduleTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM'),
  newScheduleCron: z.string().min(5),
}).strict();

export const ProposeMedicationChangeSchema = z.object({
  medicationId: z.string().uuid().optional(),
  brandName: z.string().min(2),
  changeType: z.enum(['DOSE_CHANGE', 'NEW_MED', 'DISCONTINUE']),
  proposedDosageQuantity: z.number().positive(),
  proposedDosageUnit: z.string().min(1),
  scheduleCron: z.string().min(5),
  instructions: z.string().min(3),
  verifiedDocumentRef: z.string().min(3, 'Verified clinical document reference is mandatory'),
}).strict();

export const ApproveMedicationChangeSchema = z.object({
  versionId: z.string().uuid(),
  clinicalApprovalNotes: z.string().optional(),
}).strict();

export type EditRoutineTimingDto = z.infer<typeof EditRoutineTimingSchema>;
export type ProposeMedicationChangeDto = z.infer<typeof ProposeMedicationChangeSchema>;
export type ApproveMedicationChangeDto = z.infer<typeof ApproveMedicationChangeSchema>;
