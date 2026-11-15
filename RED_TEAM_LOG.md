# ELDERCARE 360: Red-Team Adversarial Assessment Log

## Assessment Overview
- **Date**: 15 November 2026
- **Test Mode**: Adversarial simulation against local staging architecture (`apps/api`, `apps/worker`, PostgreSQL 16, Mailpit).
- **Target Assets**: Session tokens, authorization module, PostgreSQL triggers, email payloads, Firestore user persistence.

---

## Log of Adversarial Attacks

### Attack 1: BOLA / IDOR Across Family Circles
- **Attacker Persona**: Hostile family member (`user-family-circleA`).
- **Goal**: Read prescription history and sensitive doctor visit notes belonging to an unrelated elder (`elder-circleB`).
- **Method**: Captured valid session cookie; executed GET `/api/v1/circle/elder-circleB/ledger` with modified URL path.
- **Expected Outcome**: HTTP 403 Forbidden.
- **Actual Result**: **HTTP 403 Forbidden**. `PolicyEngine.authorize` verified that `user-family-circleA` possessed zero active consent grants for `elder-circleB`.
- **Verdict**: **DEFENDED (PASS)**.

### Attack 2: Stale Session Replay Post-Revocation
- **Attacker Persona**: Terminated caregiver (`user-caregiver-fired`).
- **Goal**: Confirm or view afternoon medication obligations after being removed by the elder.
- **Method**: Captured session token prior to revocation. Elder triggered `REVOKE_MEMBERSHIP`. Caregiver issued API call within 100ms.
- **Expected Outcome**: HTTP 401 Unauthorized on the immediate next request.
- **Actual Result**: **HTTP 401 Unauthorized**. PostgreSQL session lookup confirmed `revoked_at IS NOT NULL`. Next-request revocation upheld.
- **Verdict**: **DEFENDED (PASS)**.

### Attack 3: Single-User Prescription Tampering
- **Attacker Persona**: Rogue circle member (`user-anita`).
- **Goal**: Unilaterally change a high-risk medication dosage (e.g. increase Amlodipine from 5mg to 10mg) without clinician review.
- **Method**: Submitted proposal and immediately sent POST `/api/v1/medications/proposals/prop-1/approve` using own credentials.
- **Expected Outcome**: Rejection by two-person authorization guard.
- **Actual Result**: **HTTP 400 Bad Request / 403 Forbidden**. `CareRulesEngine.validatePrescriptionApproval` rejected the transaction: *"Proposer cannot approve their own prescription proposal."*
- **Verdict**: **DEFENDED (PASS)**.

### Attack 4: SQL Adherence Ledger Mutation
- **Attacker Persona**: Malicious database insider with app role credentials.
- **Goal**: Alter a missed dose row (`status = 'MISSED'`) to `status = 'TAKEN'` to conceal neglect.
- **Method**: Executed direct SQL command: `UPDATE dose_ledger SET status = 'TAKEN' WHERE id = 'dose-123';`
- **Expected Outcome**: Transaction abort by PostgreSQL trigger.
- **Actual Result**: **FATAL: SQLSTATE 20000**: *Transaction aborted by trigger `trg_prevent_dose_ledger_mutation`.* Immutability verified.
- **Verdict**: **DEFENDED (PASS)**.

### Attack 5: Protected Health Data Eavesdropping in Emails
- **Attacker Persona**: Compromised network email relay.
- **Goal**: Harvest patient disease names, dosages, and drug brands from outbound notifications.
- **Method**: Inspected raw MIME email headers and bodies dispatched to Mailpit.
- **Expected Outcome**: Zero health details or drug names exposed.
- **Actual Result**: **CONFIRMED**. Emails contained only behavioral prompts: *"Reminder: You have a scheduled medication obligation due at 8:00 AM."* All clinical entities redacted.
- **Verdict**: **DEFENDED (PASS)**.
