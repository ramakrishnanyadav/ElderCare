import { ConsentScope } from './ConsentScope';

export type UserRole = 'ELDER' | 'FAMILY_ADMIN' | 'FAMILY_MEMBER' | 'CAREGIVER';

export type ActionName =
  | 'VIEW_MEDICATIONS'
  | 'RECORD_DOSE'
  | 'EDIT_ROUTINE_TIMING'
  | 'PROPOSE_MEDICATION_CHANGE'
  | 'APPROVE_MEDICATION_CHANGE'
  | 'MANAGE_APPOINTMENTS'
  | 'VIEW_ACCESS_LEDGER'
  | 'PAUSE_SHARING'
  | 'RESUME_SHARING'
  | 'INITIATE_BREAK_GLASS'
  | 'INVITE_MEMBER'
  | 'REMOVE_MEMBER'
  | 'LEAVE_CIRCLE'
  | 'EXPORT_DATA';

export interface DecisionTableRule {
  id: string;
  action: ActionName;
  allowedRoles: UserRole[];
  requiredScope?: ConsentScope;
  requiresCircleMembership: boolean;
  requiresStepUp: boolean; // Device bound WebAuthn / Passkey
  disallowIfSharingPaused: boolean;
  notes: string;
}

export const POLICY_DECISION_TABLE: readonly DecisionTableRule[] = [
  {
    id: 'R-VIEW-MEDS',
    action: 'VIEW_MEDICATIONS',
    allowedRoles: ['ELDER', 'FAMILY_ADMIN', 'FAMILY_MEMBER', 'CAREGIVER'],
    requiredScope: 'VIEW_MEDICATIONS',
    requiresCircleMembership: true,
    requiresStepUp: false,
    disallowIfSharingPaused: true,
    notes: 'Elder always allowed. Family and caregivers blocked if sharing is paused.',
  },
  {
    id: 'R-RECORD-DOSE',
    action: 'RECORD_DOSE',
    allowedRoles: ['ELDER', 'FAMILY_ADMIN', 'CAREGIVER'],
    requiredScope: 'RECORD_ADMINISTRATION',
    requiresCircleMembership: true,
    requiresStepUp: false,
    disallowIfSharingPaused: false,
    notes: 'Safety-critical intake reporting allowed even during paused sharing.',
  },
  {
    id: 'R-EDIT-ROUTINE',
    action: 'EDIT_ROUTINE_TIMING',
    allowedRoles: ['ELDER', 'FAMILY_ADMIN'],
    requiredScope: 'EDIT_ROUTINE',
    requiresCircleMembership: true,
    requiresStepUp: false,
    disallowIfSharingPaused: false,
    notes: 'Timing edits apply with elder notification and 24h undo.',
  },
  {
    id: 'R-PROPOSE-CHANGE',
    action: 'PROPOSE_MEDICATION_CHANGE',
    allowedRoles: ['ELDER', 'FAMILY_ADMIN', 'FAMILY_MEMBER', 'CAREGIVER'],
    requiredScope: 'PROPOSE_MEDICATION_CHANGE',
    requiresCircleMembership: true,
    requiresStepUp: false,
    disallowIfSharingPaused: false,
    notes: 'Proposals create provisional draft versions awaiting second approval.',
  },
  {
    id: 'R-APPROVE-CHANGE',
    action: 'APPROVE_MEDICATION_CHANGE',
    allowedRoles: ['FAMILY_ADMIN'],
    requiredScope: 'APPROVE_MEDICATION_CHANGE',
    requiresCircleMembership: true,
    requiresStepUp: true,
    disallowIfSharingPaused: false,
    notes: 'Two-person rule: Proposer cannot approve. Caregivers cannot approve.',
  },
  {
    id: 'R-MANAGE-APPTS',
    action: 'MANAGE_APPOINTMENTS',
    allowedRoles: ['ELDER', 'FAMILY_ADMIN', 'FAMILY_MEMBER'],
    requiredScope: 'MANAGE_APPOINTMENTS',
    requiresCircleMembership: true,
    requiresStepUp: false,
    disallowIfSharingPaused: true,
    notes: 'View & schedule doctor visits.',
  },
  {
    id: 'R-VIEW-LEDGER',
    action: 'VIEW_ACCESS_LEDGER',
    allowedRoles: ['ELDER', 'FAMILY_ADMIN'],
    requiresCircleMembership: true,
    requiresStepUp: false,
    disallowIfSharingPaused: false,
    notes: 'Audit transparency for Elder and Primary Admins.',
  },
  {
    id: 'R-PAUSE-SHARING',
    action: 'PAUSE_SHARING',
    allowedRoles: ['ELDER'],
    requiresCircleMembership: false,
    requiresStepUp: true,
    disallowIfSharingPaused: false,
    notes: 'Elder autonomy over family convenience. Step-up required.',
  },
  {
    id: 'R-RESUME-SHARING',
    action: 'RESUME_SHARING',
    allowedRoles: ['ELDER'],
    requiresCircleMembership: false,
    requiresStepUp: true,
    disallowIfSharingPaused: false,
    notes: 'Resumes standard consent evaluations.',
  },
  {
    id: 'R-BREAK-GLASS',
    action: 'INITIATE_BREAK_GLASS',
    allowedRoles: ['FAMILY_ADMIN', 'FAMILY_MEMBER', 'CAREGIVER'],
    requiresCircleMembership: true,
    requiresStepUp: true,
    disallowIfSharingPaused: false,
    notes: 'Emergency access: time-limited (60 min), read-only, audited, notifies circle.',
  },
  {
    id: 'R-INVITE-MEMBER',
    action: 'INVITE_MEMBER',
    allowedRoles: ['ELDER', 'FAMILY_ADMIN'],
    requiredScope: 'MANAGE_CIRCLE',
    requiresCircleMembership: true,
    requiresStepUp: true,
    disallowIfSharingPaused: false,
    notes: 'Admins cannot grant scopes exceeding their own ceiling.',
  },
  {
    id: 'R-REMOVE-MEMBER',
    action: 'REMOVE_MEMBER',
    allowedRoles: ['ELDER', 'FAMILY_ADMIN'],
    requiredScope: 'MANAGE_CIRCLE',
    requiresCircleMembership: true,
    requiresStepUp: true,
    disallowIfSharingPaused: false,
    notes: 'Cannot remove last admin.',
  },
  {
    id: 'R-LEAVE-CIRCLE',
    action: 'LEAVE_CIRCLE',
    allowedRoles: ['FAMILY_ADMIN', 'FAMILY_MEMBER', 'CAREGIVER'],
    requiresCircleMembership: true,
    requiresStepUp: false,
    disallowIfSharingPaused: false,
    notes: 'Anyone can leave the circle, except the last admin.',
  },
  {
    id: 'R-EXPORT-DATA',
    action: 'EXPORT_DATA',
    allowedRoles: ['ELDER'],
    requiresCircleMembership: false,
    requiresStepUp: true,
    disallowIfSharingPaused: false,
    notes: 'DPDP Act compliance. Elder-only audited full export.',
  },
] as const;
