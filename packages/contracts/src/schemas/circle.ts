import { z } from 'zod';

export const GrantConsentSchema = z.object({
  elderId: z.string().uuid(),
  granteeUserId: z.string().uuid(),
  scope: z.string().min(3),
  validUntil: z.string().datetime().optional(),
}).strict();

export const RevokeConsentSchema = z.object({
  consentId: z.string().uuid(),
  revocationReason: z.string().min(3),
}).strict();

export const EmergencyAccessRequestSchema = z.object({
  elderId: z.string().uuid(),
  reason: z.string().min(10, 'A clinical justification is required for emergency access'),
  durationMinutes: z.number().int().min(10).max(60).default(60),
}).strict();

export type GrantConsentDto = z.infer<typeof GrantConsentSchema>;
export type RevokeConsentDto = z.infer<typeof RevokeConsentSchema>;
export type EmergencyAccessRequestDto = z.infer<typeof EmergencyAccessRequestSchema>;
