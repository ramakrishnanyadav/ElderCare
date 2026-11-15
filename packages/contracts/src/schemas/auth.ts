import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
}).strict();

export const ElderPinAuthSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
  deviceFingerprint: z.string().min(10),
  clientSignature: z.string().min(10),
  serverChallenge: z.string().min(16),
}).strict();

export const CreateInviteSchema = z.object({
  elderId: z.string().uuid(),
  granteeEmail: z.string().email(),
  role: z.enum(['FAMILY_ADMIN', 'FAMILY_MEMBER', 'CAREGIVER']),
  scope: z.string().min(3),
}).strict();

export const RedeemInviteSchema = z.object({
  passcode: z.string().min(8).max(8), // Crockford base32
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
}).strict();

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type ElderPinAuthRequest = z.infer<typeof ElderPinAuthSchema>;
export type CreateInviteRequest = z.infer<typeof CreateInviteSchema>;
export type RedeemInviteRequest = z.infer<typeof RedeemInviteSchema>;
