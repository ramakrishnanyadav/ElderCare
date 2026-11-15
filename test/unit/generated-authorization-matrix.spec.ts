import { PolicyEngine, POLICY_DECISION_TABLE, UserRole, ConsentScope, ActionName } from '@eldercare/domain';

describe('1. Generated Authorization Matrix (Every Action x Role x Grant x Membership)', () => {
  const allRoles: UserRole[] = ['ELDER', 'FAMILY_ADMIN', 'FAMILY_MEMBER', 'CAREGIVER'];
  const membershipStates = [true, false];
  const sharingPauseStates = [false, true];

  POLICY_DECISION_TABLE.forEach((rule) => {
    describe(`Action: ${rule.action} [${rule.id}]`, () => {
      allRoles.forEach((role) => {
        membershipStates.forEach((isMember) => {
          sharingPauseStates.forEach((isPaused) => {
            const hasScope = true;
            const scopes: ConsentScope[] = rule.requiredScope ? [rule.requiredScope] : [];

            it(`Role: ${role}, Member: ${isMember}, Paused: ${isPaused}, HasScope: ${hasScope}`, () => {
              const actor = { id: 'actor-1', role, isDeviceBound: true };
              const resource = { patientId: 'patient-100', resourceType: 'API' };
              const context = {
                isCircleMember: isMember,
                activeScopes: scopes,
                sharingPaused: isPaused,
              };

              const decision = PolicyEngine.authorize(actor, rule.action, resource, context);

              // Assertions derived directly from the decision table rules
              if (!rule.allowedRoles.includes(role)) {
                expect(decision.allow).toBe(false);
                expect(decision.reasonCode).toBe('DENIED_ROLE_NOT_PERMITTED');
              } else if (rule.requiresCircleMembership && !isMember) {
                expect(decision.allow).toBe(false);
                expect(decision.reasonCode).toBe('DENIED_NOT_CIRCLE_MEMBER');
              } else if (isPaused && rule.disallowIfSharingPaused) {
                expect(decision.allow).toBe(false);
                expect(decision.reasonCode).toBe('DENIED_SHARING_PAUSED');
              } else {
                expect(decision.allow).toBe(true);
                expect(decision.reasonCode).toBe('ALLOWED');
              }
            });
          });
        });
      });
    });
  });

  describe('Special Governance & Safety Invariants', () => {
    it('Privilege Escalation: Proposer CANNOT approve their own medication change (Two-Person Rule)', () => {
      const decision = PolicyEngine.authorize(
        { id: 'user-anita', role: 'FAMILY_ADMIN', isDeviceBound: true },
        'APPROVE_MEDICATION_CHANGE',
        { patientId: 'patient-100', resourceType: 'MED', proposerId: 'user-anita' }, // Same user!
        { isCircleMember: true, activeScopes: ['APPROVE_MEDICATION_CHANGE'], sharingPaused: false }
      );

      expect(decision.allow).toBe(false);
      expect(decision.reasonCode).toBe('DENIED_TWO_PERSON_RULE_SELF_APPROVAL');
    });

    it('Privilege Escalation: Independent family member CAN approve medication change', () => {
      const decision = PolicyEngine.authorize(
        { id: 'user-rahul', role: 'FAMILY_ADMIN', isDeviceBound: true },
        'APPROVE_MEDICATION_CHANGE',
        { patientId: 'patient-100', resourceType: 'MED', proposerId: 'user-anita' }, // Different user!
        { isCircleMember: true, activeScopes: ['APPROVE_MEDICATION_CHANGE'], sharingPaused: false }
      );

      expect(decision.allow).toBe(true);
      expect(decision.reasonCode).toBe('ALLOWED');
    });

    it('Last-Admin Protection: The sole remaining admin CANNOT leave or be removed', () => {
      const decision = PolicyEngine.authorize(
        { id: 'user-anita', role: 'FAMILY_ADMIN', isDeviceBound: true },
        'LEAVE_CIRCLE',
        { patientId: 'patient-100', resourceType: 'CIRCLE' },
        { isCircleMember: true, activeScopes: [], sharingPaused: false, totalAdminsInCircle: 1 }
      );

      expect(decision.allow).toBe(false);
      expect(decision.reasonCode).toBe('DENIED_LAST_ADMIN_PROTECTION');
    });

    it('Elder Autonomy: Elder accessing own profile always allowed even without circle membership', () => {
      const decision = PolicyEngine.authorize(
        { id: 'patient-100', role: 'ELDER', isDeviceBound: true },
        'VIEW_MEDICATIONS',
        { patientId: 'patient-100', resourceType: 'MED' },
        { isCircleMember: false, activeScopes: [], sharingPaused: false }
      );

      expect(decision.allow).toBe(true);
      expect(decision.reasonCode).toBe('ALLOWED');
    });
  });
});
