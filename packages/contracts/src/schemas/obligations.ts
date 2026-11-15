import { z } from 'zod';

export const AcknowledgeObligationSchema = z.object({
  obligationId: z.string().uuid(),
}).strict();

export const FulfillObligationSchema = z.object({
  obligationId: z.string().uuid(),
  closureEvidence: z.string().min(3),
}).strict();

export const OfflineSyncBatchSchema = z.object({
  deviceId: z.string().uuid(),
  clientSyncedAt: z.string().datetime(),
  actions: z.array(
    z.object({
      clientEventId: z.string().uuid(),
      actionType: z.enum(['RECORD_INTAKE', 'RECORD_SKIP', 'RECORD_WITNESSED']),
      slotId: z.string().uuid(),
      evidenceGrade: z.string(),
      clientTimestamp: z.string().datetime(),
      reason: z.string().optional(),
    })
  ),
}).strict();

export type AcknowledgeObligationDto = z.infer<typeof AcknowledgeObligationSchema>;
export type FulfillObligationDto = z.infer<typeof FulfillObligationSchema>;
export type OfflineSyncBatchDto = z.infer<typeof OfflineSyncBatchSchema>;
