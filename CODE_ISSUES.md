# ELDERCARE 360: Code Issues & Technical Debt Register

| Issue ID | Severity | Category | Description | File Location | Remediation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CI-01** | High | Safety | Direct `Date.now()` calls in simulation could introduce race conditions. | `FakeClock.ts`, domain packages | **FIXED**: Injected `Clock` interface strictly enforced. |
| **CI-02** | High | Security | Route action decorator omission could allow unauthenticated bypass. | `apps/api/src/controllers` | **FIXED**: `verify-route-actions.ts` audits 100% of routes at build. |
| **CI-03** | Medium | Privacy | Plaintext email templates risk leaking clinical medication names. | `EmailProvider.ts` | **FIXED**: Hard clinical keyword regex sanitizer implemented. |
| **CI-04** | Medium | Correctness| Stale horizon materialization after medication discontinuation. | `ScheduleEngine.ts` | **FIXED**: Instant slot purge trigger + scheduler guard. |
| **CI-05** | Low | Usability | Inconsistent touch target sizing in mobile views. | `index.css`, UI buttons | **FIXED**: Minimum 56px touch target standard enforced in Elder Mode. |
| **CI-06** | Low | Maintainability| Scattered environment variable lookups. | `apps/api/src/config` | **FIXED**: Validated `dotenv` configuration centralized. |
