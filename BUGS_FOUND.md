# ELDERCARE 360: Defects Found, Root Causes, Fixes & Regression Tests

## Summary of Defects Identified and Resolved

| Bug ID | Defect Description | Root Cause | Fix Applied | Regression Test Created |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-01** | Missing Firebase authentication and Firestore profile persistence integration. | Previous build turns focused on mock auth without cloud persistence. | Implemented `src/firebase/firebaseConfig.ts`, `src/firebase/authService.ts`, and `FirebaseDetailsModal.tsx` linking Auth state with Cloud Firestore. | `test/unit/firebase-auth-service.spec.ts` |
| **BUG-02** | Risk of clinical drug name or diagnosis leakage into notification emails. | Raw medication strings in reminder triggers could be passed directly to transport template. | Implemented hard keyword privacy sanitizer in `EmailProvider.ts` that intercepts and redacts clinical terms into `[HEALTH_DETAILS_REDACTED]`. | `test/unit/email-privacy-sanitizer.spec.ts` |
| **BUG-03** | Potential self-approval of prescription alterations by a single family member. | Logic allowed any member with `MANAGE_MEDICATIONS` scope to approve proposals. | Enhanced `CareRulesEngine.validatePrescriptionApproval` to strictly reject approval when `approverId === proposal.proposedByUserId`. | `test/unit/care-rules.spec.ts` (Rule R2) |
| **BUG-04** | Horizon regeneration generating events for discontinued medications. | Scheduler loop checked horizon bounds without evaluating `medicine.isDiscontinued` flag. | Added guard in `ScheduleEngine.generateDoseSlots` returning empty array when `config.isDiscontinued === true` and enforced DB trigger on status update. | `test/unit/differential-schedule.spec.ts` |
| **BUG-05** | Symlink access denied failure on Windows OneDrive during package linking. | Default pnpm virtual store relies on Windows filesystem symlink creation. | Configured hoisted dependency linker and fallback to flat npm packaging in `.npmrc` and workspace. | Clean package installation verification |
| **BUG-06** | Vulnerability to timing attacks / user enumeration on authentication failure. | Error messages returned distinct strings for "User not found" vs "Invalid password". | Unified authentication failure responses to generic, uniform error envelopes in `AuthService.ts` and `http-exception.filter.ts`. | Security AuthN test suite |
