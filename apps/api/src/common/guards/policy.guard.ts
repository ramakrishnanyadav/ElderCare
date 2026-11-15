import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_ACTION_KEY } from '../decorators/require-action.decorator';
import { PolicyEngine, ActionName, ConsentScope } from '@eldercare/domain';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.get<ActionName>(
      REQUIRE_ACTION_KEY,
      context.getHandler()
    );

    // Startup / route verification requirement: Every route must declare an action!
    if (!action) {
      throw new ForbiddenException('Safety violation: Route lacks declared authorization action.');
    }

    const request = context.switchToHttp().getRequest();
    const actor = request.actor;
    if (!actor) {
      throw new ForbiddenException('Unauthenticated actor context.');
    }

    // Resolve target patient / elder ID from params, query, or body
    const patientId =
      request.params.patientId ||
      request.params.elderId ||
      request.query.patientId ||
      request.body.patientId ||
      request.body.elderId ||
      actor.id;

    // Load facts once per request from PostgreSQL
    const [membership, consentGrants, elderRecord, emergency] = await Promise.all([
      this.db.querySingle<{ status: string; is_on_call: boolean }>(
        `SELECT status, is_on_call FROM care_members WHERE elder_id = $1 AND user_id = $2`,
        [patientId, actor.id]
      ),
      this.db.query<{ scope: string }>(
        `SELECT scope FROM consent_grants 
         WHERE elder_id = $1 AND grantee_user_id = $2 AND is_revoked = FALSE 
           AND (valid_until IS NULL OR valid_until > NOW())`,
        [patientId, actor.id]
      ),
      this.db.querySingle<{ sharing_paused: boolean }>(
        `SELECT sharing_paused FROM elders WHERE id = $1`,
        [patientId]
      ),
      this.db.querySingle<{ id: string }>(
        `SELECT id FROM emergency_access 
         WHERE elder_id = $1 AND requester_user_id = $2 AND is_active = TRUE AND expires_at > NOW()`,
        [patientId, actor.id]
      ),
    ]);

    const isCircleMember = !!membership && membership.status === 'ACTIVE';
    const activeScopes = consentGrants.map((g) => g.scope as ConsentScope);
    const sharingPaused = elderRecord?.sharing_paused || false;
    const isEmergencyActive = !!emergency;

    // Optional metadata check (e.g. proposerId for two-person rule)
    const proposerId = request.body.proposerId || request.body.proposerUserId;

    // Execute pure PolicyEngine decision
    const decision = PolicyEngine.authorize(
      { id: actor.id, role: actor.role, isDeviceBound: actor.isDeviceBound },
      action,
      { patientId, resourceType: 'API_ENDPOINT', proposerId },
      {
        isCircleMember,
        activeScopes,
        sharingPaused,
        isEmergencyActive,
      }
    );

    if (!decision.allow) {
      throw new ForbiddenException(`Access denied by policy engine: ${decision.reasonCode}`);
    }

    // Attach decision and context to request for audit interceptor
    request.policyDecision = decision;
    request.targetPatientId = patientId;

    return true;
  }
}
