# ELDERCARE 360: Safety, Functional & Security Traceability Matrix

| Req ID | Requirement Description | Implementation Component | Test Suite / Test ID | Verification Type | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NN-1** | Elder autonomy; Next-request consent revocation | `PolicyEngine.ts`, `session-auth.guard.ts` | `test/unit/generated-authorization-matrix.spec.ts` (Test A1-A4) | Automated Unit & Integration | **PASS** |
| **NN-2** | Verified data over AI inference; Zero LLM in safety path | Architecture constraint (`packages/domain`) | Architectural boundary audit (`verify-route-actions.ts`) | Static Analysis & Code Gate | **PASS** |
| **NN-3** | Never claim dose swallowed; Strict Evidence Grades | `EvidenceGrade.ts`, `DoseStateMachine.ts` | `test/unit/dose-state-machine.spec.ts` (Test D1-D8) | Model-Based Property Test | **PASS** |
| **NN-4** | Never recommend or shift dose; Two-person rule | `DoseStateMachine.ts`, `PolicyEngine.ts` | `test/unit/care-rules.spec.ts` (Rules R1, R2, R4) | Property & Sabotage Test | **PASS** |
| **NN-5** | Zero health details in emails, logs, metrics | `EmailProvider.ts`, `AuditLogInterceptor.ts` | `test/unit/email-privacy-sanitizer.spec.ts` | Regex & Sentinel Fuzzing | **PASS** |
| **NN-6** | Explicit clinical & legal sign-off registers | `clinicalConfig.ts`, `CLINICAL_SAFETY_REGISTER.md` | `docs/validation/clinician-review-checklist.md` | Human Review Gate | **PASS** |
| **R1** | Access: Elder PIN / passkey, Argon2id, single-use invite | `AuthService.ts`, `ElderPinKeypad.tsx` | `test/unit/firebase-auth-service.spec.ts`, AuthN test suite | Cryptographic & Model Test | **PASS** |
| **R2** | Medication schedules, 24h timing undo, verified document | `ScheduleEngine.ts`, `CareRulesEngine.ts` | `test/unit/schedule-properties.spec.ts`, fast-check suite | Metamorphic & Differential | **PASS** |
| **R3** | Append-only ledger, SHA-256 hash chaining, verifier | `002_triggers_and_immutability.sql`, `DatabaseService` | `test/unit/hash-chain-integrity.spec.ts` | SQL Trigger & Mutation Test | **PASS** |
| **R4** | Appointments: Pre-visit brief, post-visit reconciliation | `appointments.ts`, `CareRulesEngine.ts` | `test/unit/care-rules.spec.ts` (Rule R6) | Integration & Workflow | **PASS** |
| **R5** | Escalation ladder (+45m, +75m, +105m), quiet hours | `EscalationPlanner.ts`, `JobRunner.ts` | `test/unit/escalation-planner.spec.ts` | Injected Clock Simulation | **PASS** |
| **R6** | Obligations, on-call handover, deterministic silence | `CareRulesEngine.ts`, `HourlyInvariantsReconciler.ts` | `test/unit/care-rules.spec.ts` (Rules R3, R5, R8) | Invariant Engine Suite | **PASS** |
| **SEC-1** | OWASP API Top 10 compliance & BOLA defense | `policy.guard.ts`, `PolicyEngine.ts` | `test/unit/generated-authorization-matrix.spec.ts` | Combinatorial Matrix | **PASS** |
| **A11Y-1**| Touch targets $\ge 56\text{px}$, Contrast $\ge 7:1$, WCAG AA | `index.css`, `tailwind.config.js`, UI components | Target & Contrast Automated Test Suite | Axe & Playwright Audit | **PASS** |
| **FB-1** | Firebase Authentication & Firestore persistence | `firebaseConfig.ts`, `authService.ts` | `test/unit/firebase-auth-service.spec.ts` | Unit & Mock Verification | **PASS** |
