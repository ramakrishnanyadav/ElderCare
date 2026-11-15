import { EvidenceGrade } from './EvidenceGrade';
import { Clock } from '../clock/Clock';

export type DoseState =
  | 'SCHEDULED'
  | 'REMINDED'
  | 'ACKNOWLEDGED'
  | 'UNCONFIRMED'
  | 'REPORTED_TAKEN'
  | 'REPORTED_SKIPPED'
  | 'REPORTED_DECLINED'
  | 'NEEDS_FOLLOW_UP'
  | 'CORRECTED'
  | 'RESOLVED';

export type DoseAction =
  | 'SEND_REMINDER'
  | 'ACKNOWLEDGE_PENDING'
  | 'EXPIRE_GRACE_PERIOD'
  | 'RECORD_INTAKE'
  | 'RECORD_SKIP'
  | 'RECORD_DECLINE'
  | 'FLAG_FOR_FOLLOW_UP'
  | 'APPLY_CORRECTION'
  | 'RESOLVE_EVENT';

export interface TransitionContext {
  actorId: string;
  actorRole: string;
  reason?: string;
  evidenceGrade?: EvidenceGrade;
  idempotencyKey?: string;
  notificationId?: string;
}

export interface TransitionResult {
  fromState: DoseState;
  toState: DoseState;
  timestamp: string;
  actorId: string;
  evidenceGrade?: EvidenceGrade;
  reason?: string;
  isDuplicate: boolean;
  auditedAction: string;
}

export class DoseStateMachine {
  constructor(private readonly clock: Clock) {}

  transition(
    currentState: DoseState,
    action: DoseAction,
    ctx: TransitionContext
  ): TransitionResult {
    const timestamp = this.clock.iso();

    // Idempotent duplicate check on resolved / confirmed states
    if (
      (currentState === 'REPORTED_TAKEN' && action === 'RECORD_INTAKE') ||
      (currentState === 'RESOLVED' && action === 'RESOLVE_EVENT') ||
      (currentState === 'REPORTED_SKIPPED' && action === 'RECORD_SKIP')
    ) {
      return {
        fromState: currentState,
        toState: currentState,
        timestamp,
        actorId: ctx.actorId,
        evidenceGrade: ctx.evidenceGrade,
        reason: ctx.reason,
        isDuplicate: true,
        auditedAction: 'DUPLICATE_ATTEMPT_IGNORED',
      };
    }

    let nextState: DoseState;

    switch (currentState) {
      case 'SCHEDULED':
        if (action === 'SEND_REMINDER') nextState = 'REMINDED';
        else if (action === 'RECORD_INTAKE') nextState = 'REPORTED_TAKEN';
        else if (action === 'RECORD_SKIP') nextState = 'REPORTED_SKIPPED';
        else if (action === 'EXPIRE_GRACE_PERIOD') nextState = 'UNCONFIRMED';
        else throw new Error(`Invalid transition: ${action} from ${currentState}`);
        break;

      case 'REMINDED':
        if (action === 'ACKNOWLEDGE_PENDING') nextState = 'ACKNOWLEDGED';
        else if (action === 'EXPIRE_GRACE_PERIOD') nextState = 'UNCONFIRMED';
        else if (action === 'RECORD_INTAKE') nextState = 'REPORTED_TAKEN';
        else if (action === 'RECORD_SKIP') nextState = 'REPORTED_SKIPPED';
        else if (action === 'RECORD_DECLINE') nextState = 'REPORTED_DECLINED';
        else throw new Error(`Invalid transition: ${action} from ${currentState}`);
        break;

      case 'ACKNOWLEDGED':
        if (action === 'RECORD_INTAKE') nextState = 'REPORTED_TAKEN';
        else if (action === 'RECORD_SKIP') nextState = 'REPORTED_SKIPPED';
        else if (action === 'EXPIRE_GRACE_PERIOD') nextState = 'UNCONFIRMED';
        else throw new Error(`Invalid transition: ${action} from ${currentState}`);
        break;

      case 'UNCONFIRMED':
        if (action === 'RECORD_INTAKE') nextState = 'REPORTED_TAKEN';
        else if (action === 'RECORD_SKIP') nextState = 'REPORTED_SKIPPED';
        else if (action === 'FLAG_FOR_FOLLOW_UP') nextState = 'NEEDS_FOLLOW_UP';
        else throw new Error(`Invalid transition: ${action} from ${currentState}`);
        break;

      case 'REPORTED_TAKEN':
      case 'REPORTED_SKIPPED':
      case 'REPORTED_DECLINED':
        if (action === 'RESOLVE_EVENT') nextState = 'RESOLVED';
        else if (action === 'APPLY_CORRECTION') nextState = 'CORRECTED';
        else throw new Error(`Invalid transition: ${action} from ${currentState}`);
        break;

      case 'NEEDS_FOLLOW_UP':
        if (action === 'RECORD_INTAKE') nextState = 'REPORTED_TAKEN';
        else if (action === 'RECORD_SKIP') nextState = 'REPORTED_SKIPPED';
        else if (action === 'RESOLVE_EVENT') nextState = 'RESOLVED';
        else throw new Error(`Invalid transition: ${action} from ${currentState}`);
        break;

      case 'CORRECTED':
        if (action === 'RECORD_INTAKE') nextState = 'REPORTED_TAKEN';
        else if (action === 'RESOLVE_EVENT') nextState = 'RESOLVED';
        else throw new Error(`Invalid transition: ${action} from ${currentState}`);
        break;

      case 'RESOLVED':
        if (action === 'APPLY_CORRECTION') nextState = 'CORRECTED';
        else throw new Error(`Invalid transition: ${action} from ${currentState}`);
        break;

      default:
        throw new Error(`Unknown dose state: ${currentState}`);
    }

    return {
      fromState: currentState,
      toState: nextState,
      timestamp,
      actorId: ctx.actorId,
      evidenceGrade: ctx.evidenceGrade,
      reason: ctx.reason,
      isDuplicate: false,
      auditedAction: `TRANSITION_${action}`,
    };
  }
}
