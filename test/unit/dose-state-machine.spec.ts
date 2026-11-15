import { DoseStateMachine, FakeClock, EvidenceGrade } from '@eldercare/domain';

describe('14. Dose State Machine & Idempotent Confirmations', () => {
  let clock: FakeClock;
  let sm: DoseStateMachine;

  beforeEach(() => {
    clock = new FakeClock(new Date('2026-11-15T08:00:00.000Z'));
    sm = new DoseStateMachine(clock);
  });

  it('Happy Path: SCHEDULED -> REMINDED -> REPORTED_TAKEN -> RESOLVED', () => {
    const t1 = sm.transition('SCHEDULED', 'SEND_REMINDER', {
      actorId: 'system',
      actorRole: 'SYSTEM',
    });
    expect(t1.toState).toBe('REMINDED');
    expect(t1.isDuplicate).toBe(false);

    const t2 = sm.transition('REMINDED', 'RECORD_INTAKE', {
      actorId: 'kamala-elder',
      actorRole: 'ELDER',
      evidenceGrade: 'PATIENT_REPORTED',
    });
    expect(t2.toState).toBe('REPORTED_TAKEN');
    expect(t2.evidenceGrade).toBe('PATIENT_REPORTED');
    expect(t2.isDuplicate).toBe(false);

    const t3 = sm.transition('REPORTED_TAKEN', 'RESOLVE_EVENT', {
      actorId: 'system',
      actorRole: 'SYSTEM',
    });
    expect(t3.toState).toBe('RESOLVED');
  });

  it('Idempotency Invariant: Duplicate intake confirmation yields one logical action plus audited duplicate', () => {
    // 1st intake record
    const t1 = sm.transition('SCHEDULED', 'RECORD_INTAKE', {
      actorId: 'kamala-elder',
      actorRole: 'ELDER',
      evidenceGrade: 'PATIENT_REPORTED',
    });
    expect(t1.toState).toBe('REPORTED_TAKEN');
    expect(t1.isDuplicate).toBe(false);

    // 2nd intake record on same slot (e.g. repeated button tap or desynchronized device)
    const t2 = sm.transition('REPORTED_TAKEN', 'RECORD_INTAKE', {
      actorId: 'sunita-caregiver',
      actorRole: 'CAREGIVER',
      evidenceGrade: 'CAREGIVER_WITNESSED',
    });
    // Invariant: Remains in REPORTED_TAKEN, marked isDuplicate = true
    expect(t2.toState).toBe('REPORTED_TAKEN');
    expect(t2.isDuplicate).toBe(true);
    expect(t2.auditedAction).toBe('DUPLICATE_ATTEMPT_IGNORED');
  });

  it('Grace Period Expiration: SCHEDULED -> UNCONFIRMED when grace window passes', () => {
    const t1 = sm.transition('SCHEDULED', 'EXPIRE_GRACE_PERIOD', {
      actorId: 'worker-scheduler',
      actorRole: 'SYSTEM',
      reason: 'Grace window expired without confirmation',
    });
    expect(t1.toState).toBe('UNCONFIRMED');
  });

  it('Append-Only Correction: RESOLVED slot corrected via APPLY_CORRECTION transitions to CORRECTED', () => {
    const t1 = sm.transition('RESOLVED', 'APPLY_CORRECTION', {
      actorId: 'dr-kapoor',
      actorRole: 'CLINICIAN',
      evidenceGrade: 'CLINICIAN_RECORDED',
      reason: 'Patient reported vomiting immediately post-ingestion',
    });
    expect(t1.toState).toBe('CORRECTED');
  });
});
