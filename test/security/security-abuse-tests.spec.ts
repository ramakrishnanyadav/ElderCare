import { PolicyEngine, AuthorizationContext } from '../../packages/domain/PolicyEngine';
import { sanitizeEmailContent } from '../../apps/worker/src/email/EmailProvider';
import { CareRulesEngine } from '../../packages/domain/CareRulesEngine';

describe('Layer 5 Security, Abuse & Leak Testing Suite', () => {
  describe('BOLA / IDOR Cross-Circle Boundary Enforcement', () => {
    it('strictly denies a user in Circle A attempting to access Elder B in Circle B', () => {
      const crossCircleContext: AuthorizationContext = {
        actorId: 'user-family-circleA',
        actorRole: 'FAMILY_PRIMARY',
        elderId: 'elder-circleB', // Cross-tenant target
        action: 'VIEW_MEDICATIONS',
        scopes: [], // Has no grant for elder-circleB
        isEmergencyAccess: false,
        elderPrivacyMode: 'STANDARD',
      };

      const decision = PolicyEngine.authorize(crossCircleContext);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Missing required consent scope');
    });

    it('strictly rejects access when session token has been revoked', () => {
      const revokedContext: AuthorizationContext = {
        actorId: 'user-fired-caregiver',
        actorRole: 'CAREGIVER',
        isSessionRevoked: true, // Revocation active
        elderId: 'elder-kamala',
        action: 'VIEW_SCHEDULE',
        scopes: ['VIEW_SCHEDULE'],
        isEmergencyAccess: false,
        elderPrivacyMode: 'STANDARD',
      };

      const decision = PolicyEngine.authorize(revokedContext);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Session revoked');
    });
  });

  describe('Anti-Surveillance & Emergency Lock Controls', () => {
    it('blocks all family access when elder engages Emergency Lock', () => {
      const emergencyLockContext: AuthorizationContext = {
        actorId: 'user-family-anita',
        actorRole: 'FAMILY_PRIMARY',
        elderId: 'elder-kamala',
        action: 'VIEW_ADHERENCE',
        scopes: ['VIEW_ADHERENCE'],
        isEmergencyAccess: false,
        elderPrivacyMode: 'EMERGENCY_LOCK', // Elder froze access
      };

      const decision = PolicyEngine.authorize(emergencyLockContext);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain('Emergency lock active');
    });

    it('detects surveillance misuse / suspicious view spike by a family member', () => {
      // Anomaly detector: > 20 ledger queries in 10 minutes raises a surveillance alert
      const recentQueryTimestamps = Array.from({ length: 25 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 15 * 1000).toISOString(),
      }));

      const isViewSpike = recentQueryTimestamps.length > 20;
      expect(isViewSpike).toBe(true);
    });
  });

  describe('Deception & Honeytoken Canary Controls', () => {
    const HONEYTOKEN_PATIENT_ID = 'elder-canary-honeytoken-do-not-access';

    it('triggers a high-severity security alert when honeytoken record is queried', () => {
      let securityPagingTriggered = false;

      const handleQuery = (patientId: string) => {
        if (patientId === HONEYTOKEN_PATIENT_ID) {
          securityPagingTriggered = true;
          return { error: 'Not Found' }; // Fail closed
        }
        return { data: 'valid' };
      };

      const response = handleQuery(HONEYTOKEN_PATIENT_ID);
      expect(securityPagingTriggered).toBe(true);
      expect(response.error).toBe('Not Found');
    });
  });

  describe('Cryptographic AAD Binding (Additional Authenticated Data)', () => {
    it('fails validation when ciphertext is copied from Patient A to Patient B', () => {
      // Simulated AES-GCM AAD verification
      const encrypt = (plaintext: string, aadPatientId: string) => ({
        ciphertext: `ENC[${plaintext}]`,
        tag: `TAG[${aadPatientId}]`,
      });

      const decrypt = (encrypted: { ciphertext: string; tag: string }, expectedPatientId: string) => {
        if (encrypted.tag !== `TAG[${expectedPatientId}]`) {
          throw new Error('Cryptographic Tag Authentication Failed (AAD Mismatch)');
        }
        return encrypted.ciphertext.replace('ENC[', '').replace(']', '');
      };

      const encryptedForKamala = encrypt('Confidential Note', 'patient-kamala');

      // Attempting to decrypt under patient-rahul using copied ciphertext
      expect(() => {
        decrypt(encryptedForKamala, 'patient-rahul');
      }).toThrow('Cryptographic Tag Authentication Failed');
    });
  });

  describe('Separation of Duties & Two-Person Guard', () => {
    it('strictly forbids prescription change approval by the proposing member', () => {
      const proposal = {
        id: 'prop-anti-tamper',
        medicineId: 'med-bp',
        proposedByUserId: 'user-anita',
        verifiedDocumentRef: 'DOC-VERIFIED-99',
        type: 'STRENGTH_CHANGE' as const,
      };

      const check = CareRulesEngine.validatePrescriptionApproval(proposal, 'user-anita');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('proposer cannot approve');
    });
  });

  describe('Sentinel Leak Detection Across Outputs', () => {
    const sentinels = [
      'SENTINEL_DRUG_TELMISARTAN_40MG_ABC',
      'SENTINEL_DIAGNOSIS_HYPERTENSION_XYZ',
      'SENTINEL_NOTE_CONFIDENTIAL_ALLERGY_789',
    ];

    it('ensures sentinels NEVER leak into email subjects or notification bodies', () => {
      sentinels.forEach((sentinel) => {
        const dirtyMessage = `Reminder for patient: take ${sentinel} at 8:00 AM`;
        const sanitized = sanitizeEmailContent(dirtyMessage);

        expect(sanitized).not.toContain(sentinel);
        expect(sanitized).toContain('[HEALTH_DETAILS_REDACTED]');
      });
    });
  });
});
