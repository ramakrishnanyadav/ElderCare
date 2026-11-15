import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  elderId: z.string().uuid(),
  doctorName: z.string().min(2),
  specialty: z.string().min(2),
  clinicName: z.string().min(2),
  scheduledAt: z.string().datetime(),
  prepTasks: z.array(z.string()).default([]),
}).strict();

export const CaptureVisitNotesSchema = z.object({
  appointmentId: z.string().uuid(),
  clinicalNotes: z.string().min(5),
}).strict();

export const ReconcilePrescriptionProposalSchema = z.object({
  appointmentId: z.string().uuid(),
  proposals: z.array(
    z.object({
      brandName: z.string().min(2),
      changeType: z.enum(['DOSE_CHANGE', 'NEW_MED', 'DISCONTINUE']),
      proposedDosage: z.string().min(1),
      verifiedDocumentRef: z.string().min(2),
    })
  ),
}).strict();

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>;
export type CaptureVisitNotesDto = z.infer<typeof CaptureVisitNotesSchema>;
export type ReconcilePrescriptionProposalDto = z.infer<typeof ReconcilePrescriptionProposalSchema>;
