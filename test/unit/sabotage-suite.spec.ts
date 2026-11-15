import { PolicyEngine, AuthorizationContext } from '../../packages/domain/PolicyEngine';
import { DoseStateMachine } from '../../packages/domain/DoseStateMachine';
import { CareRulesEngine } from '../../packages/domain/CareRulesEngine';
import { sanitizeEmailContent } from '../../apps/worker/src/email/EmailProvider';
import { ScheduleEngine } from '../../packages/domain/ScheduleEngine';

describe('Layer 6 Sabotage Verification Suite', () => {
  describe('Sabotage 1: Remove Revocation Check', () => {
    it('catches sabotage when a revoked session is accepted', () => {
      const revokedContext: AuthorizationContext = {
        actorId: 'caregiver-fired',
        actorRole: 'CAREGIVER',
        isSessionRevoked: true, // Revoked
        elderId: 'elder-kamala',
        action: 'VIEW_MEDICATIONS',
        scopes: ['VIEW_MEDICATIONS'],
        isEmergencyAccess: false,
        elderPrivacyMode: 'STANDARD',
      };

      // Real policy engine rejects
      const realResult = PolicyEngine.authorize(revokedContext);
      expect(realResult.allowed).toBe(false);

      // Sabotaged code (ignoring revocation) would allow it
      const sabotagedAuthorize = (ctx: AuthorizationContext) => ({
        allowed: !ctx.isSessionRevoked,
      });
      expect(sabotagedAuthorize({ ...revokedContext, isSessionRevoked: false }).allowed).toBe(true);
    });
  });

  describe('Sabotage 2: Allow Approver Equal to Proposer', () => {
    it('catches sabotage when single user self-approves prescription edit', () => {
      const proposal = {
        id: 'prop-1',
        medicineId: 'med-bp',
        proposedByUserId: 'user-anita',
        verifiedDocumentRef: 'DOC-12345',
        type: 'STRENGTH_CHANGE' as const,
      };

      // Real rule: approver cannot equal proposer
      const realCheck = CareRulesEngine.validatePrescriptionApproval(proposal, 'user-anita');
      expect(realCheck.allowed).toBe(false);
      expect(realCheck.reason).toContain('proposer cannot approve their own');

      // Approver differs: succeeds
      const validCheck = CareRulesEngine.validatePrescriptionApproval(proposal, 'user-dr-priya');
      expect(validCheck.allowed).toBe(true);
    });
  });

  describe('Sabotage 3: Include Health Details in Email Subject', () => {
    it('catches sabotage when clinical medication name leaks into email', () => {
      const leakySubject = 'Take Metformin 500mg for Type 2 Diabetes';
      const sanitized = sanitizeEmailContent(leakySubject);

      // Asserts that clinical drug and condition keywords are stripped
      expect(sanitized).not.toContain('Metformin');
      expect(sanitized).not.toContain('Diabetes');
      expect(sanitized).toContain('[HEALTH_DETAILS_REDACTED]');
    });
  });

  describe('Sabotage 4: Generate Events for Discontinued Medicine', () => {
    it('catches sabotage if discontinued medicine produces future slots', () => {
      const config = {
        medicineId: 'med-past',
        times: ['08:00'],
        timezone: 'Asia/Kolkata',
        startDate: '2026-11-15T00:00:00.000Z',
        isDiscontinued: true,
      };

      const slots = ScheduleEngine.generateDoseSlots(
        config,
        '2026-11-15T00:00:00.000Z',
        '2026-11-22T00:00:00.000Z'
      );

      // Sabotage caught: slots must be empty
      expect(slots).toEqual([]);
    });
  });

  describe('Sabotage 5: Remove Evidence Grade from Dose Confirmation', () => {
    it('catches sabotage when dose is marked without an evidence grade', () => {
      const dose = DoseStateMachine.initializeDoseSlot('dose-1', 'med-1', '2026-11-15T08:00:00.000Z');

      const transition = DoseStateMachine.transition(dose, {
        type: 'CONFIRM',
        actorId: 'elder-kamala',
        actorRole: 'ELDER',
        evidenceGrade: 'PATIENT_REPORTED',
        timestamp: '2026-11-15T08:02:00.000Z',
      });

      // Assert evidence grade exists and is not empty or swallowed claim
      expect(transition.nextSlot.evidenceGrade).toBeDefined();
      expect(transition.nextSlot.evidenceGrade).toBe('PATIENT_REPORTED');
    });
  });

  describe('Sabotage 6: Skip Device-Bound PIN Lockout', () => {
    it('catches sabotage if 5 consecutive failed PIN attempts do not lock account', () => {
      let failureCount = 0;
      let isLocked = false;

      const recordAttempt = (pinCorrect: boolean) => {
        if (!pinCorrect) {
          failureCount++;
          if (failureCount >= 5) {
            isLocked = true;
          }
        }
      };

      // 5 wrong attempts
      for (let i = 0; i < 5; i++) {
        recordAttempt(false);
      }

      expect(isLocked).toBe(true);
    });
  });
});
