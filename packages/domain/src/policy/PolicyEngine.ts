import { ConsentScope } from './ConsentScope';
import { ActionName, UserRole, POLICY_DECISION_TABLE } from './DecisionTable';

export interface PolicyActor {
  id: string;
  role: UserRole;
  isDeviceBound: boolean;
}

export interface PolicyResource {
  patientId: string;
  resourceType: string;
  ownerId?: string;
  proposerId?: string;
}

export interface PolicyContext {
  isCircleMember: boolean;
  activeScopes: ConsentScope[];
  sharingPaused: boolean;
  isEmergencyActive?: boolean;
  totalAdminsInCircle?: number;
}

export interface PolicyDecision {
  allow: boolean;
  reasonCode:
    | 'ALLOWED'
    | 'DENIED_ROLE_NOT_PERMITTED'
    | 'DENIED_NOT_CIRCLE_MEMBER'
    | 'DENIED_MISSING_SCOPE'
    | 'DENIED_SHARING_PAUSED'
    | 'DENIED_STEP_UP_REQUIRED'
    | 'DENIED_TWO_PERSON_RULE_SELF_APPROVAL'
    | 'DENIED_LAST_ADMIN_PROTECTION'
    | 'DENIED_UNKNOWN_ACTION';
  obligations?: string[];
}

export class PolicyEngine {
  static authorize(
    actor: PolicyActor,
    action: ActionName,
    resource: PolicyResource,
    ctx: PolicyContext
  ): PolicyDecision {
    // 1. Locate rule in typed decision table
    const rule = POLICY_DECISION_TABLE.find((r) => r.action === action);
    if (!rule) {
      return { allow: false, reasonCode: 'DENIED_UNKNOWN_ACTION' };
    }

    // 2. Elder autonomy shortcut: Elder accessing their own data
    if (actor.role === 'ELDER' && actor.id === resource.patientId) {
      if (rule.requiresStepUp && !actor.isDeviceBound) {
        return { allow: false, reasonCode: 'DENIED_STEP_UP_REQUIRED' };
      }
      return { allow: true, reasonCode: 'ALLOWED' };
    }

    // 3. Role check
    if (!rule.allowedRoles.includes(actor.role)) {
      return { allow: false, reasonCode: 'DENIED_ROLE_NOT_PERMITTED' };
    }

    // 4. Step-up check (Device bound passkey / PIN)
    if (rule.requiresStepUp && !actor.isDeviceBound) {
      return { allow: false, reasonCode: 'DENIED_STEP_UP_REQUIRED' };
    }

    // 5. Circle membership check
    if (rule.requiresCircleMembership && !ctx.isCircleMember) {
      return { allow: false, reasonCode: 'DENIED_NOT_CIRCLE_MEMBER' };
    }

    // 6. Privacy mode / Sharing pause check (Safety events like RECORD_DOSE bypass)
    if (ctx.sharingPaused && rule.disallowIfSharingPaused && !ctx.isEmergencyActive) {
      return { allow: false, reasonCode: 'DENIED_SHARING_PAUSED' };
    }

    // 7. Scoped consent check
    if (rule.requiredScope && !ctx.activeScopes.includes(rule.requiredScope) && !ctx.isEmergencyActive) {
      return { allow: false, reasonCode: 'DENIED_MISSING_SCOPE' };
    }

    // 8. Specific domain invariant guards:
    // Invariant: Two-person rule. Proposer cannot approve their own change!
    if (action === 'APPROVE_MEDICATION_CHANGE') {
      if (resource.proposerId && resource.proposerId === actor.id) {
        return {
          allow: false,
          reasonCode: 'DENIED_TWO_PERSON_RULE_SELF_APPROVAL',
        };
      }
    }

    // Invariant: Last-admin protection. The last remaining admin cannot leave or be removed.
    if ((action === 'LEAVE_CIRCLE' || action === 'REMOVE_MEMBER') && actor.role === 'FAMILY_ADMIN') {
      if (ctx.totalAdminsInCircle !== undefined && ctx.totalAdminsInCircle <= 1) {
        return {
          allow: false,
          reasonCode: 'DENIED_LAST_ADMIN_PROTECTION',
        };
      }
    }

    return {
      allow: true,
      reasonCode: 'ALLOWED',
      obligations: ctx.isEmergencyActive ? ['RECORD_AUDIT_LOG_EMERGENCY'] : undefined,
    };
  }
}
