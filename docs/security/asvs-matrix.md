# ELDERCARE 360: OWASP ASVS Level 3 Verification Matrix

**Standard Reference:** OWASP Application Security Verification Standard (ASVS) v4.0.3 Level 3 (Healthcare / High-Assurance Applications).

| ASVS ID | Verification Requirement | Architecture Control / Mechanism | Status | Evidence / Verification Test |
| :--- | :--- | :--- | :--- | :--- |
| **V1.1** | Architecture, design and threat modelling | STRIDE threat model, DCB0129 clinical risk register, LINDDUN privacy analysis. | **PASS** | `docs/security/threat-model.md`, `CLINICAL_SAFETY_REGISTER.md` |
| **V2.1** | Password & credential security | Argon2id memory-hard parameters ($m=65536, t=3, p=4$), per-user salt. | **PASS** | `packages/contracts/auth.ts`, `AuthService.ts` |
| **V2.2** | General authenticator security | Passkeys preferred, WebAuthn Level 3 challenge-response, device binding. | **PASS** | SimpleWebAuthn integration, `ElderPinKeypad.tsx` |
| **V2.5** | Credential recovery | Verified admin flow with cooling-off period; cannot bypass consent. | **PASS** | `CareRulesEngine.ts` (Rule R8) |
| **V3.1** | Session management | Opaque 256-bit crypto-random tokens, SHA-256 hashed at rest in PostgreSQL. | **PASS** | `ADR-001`, `session-auth.guard.ts` |
| **V3.2** | Session binding & cookie security | `__Host-` prefix, `HttpOnly`, `Secure`, `SameSite=Strict`, no JWT in client. | **PASS** | `main.ts`, cookie parser configuration |
| **V3.3** | Session termination & revocation | Next-request revocation guaranteed by direct DB lookup on each request. | **PASS** | `test/unit/generated-authorization-matrix.spec.ts` |
| **V4.1** | Access control design | Deny-by-default, centralized `PolicyEngine.authorize`, separation of duties. | **PASS** | `PolicyEngine.ts`, `policy.guard.ts` |
| **V4.2** | Operation level access control | 100% of routes guarded by `@RequireAction(...)` and validated at build. | **PASS** | `scripts/verify-route-actions.ts` |
| **V5.1** | Input validation | Zod strict validation at all HTTP boundaries; extra/unknown fields rejected. | **PASS** | `packages/contracts/*.ts`, NestJS ValidationPipe |
| **V6.2** | Algorithms and cipher suites | AES-256-GCM / libsodium envelope encryption; SHA-256 hash-chaining. | **PASS** | `DatabaseService.ts`, `hash-chain-integrity.spec.ts` |
| **V7.1** | Error handling and logging hygiene | HTTP exception filter sanitizes errors; zero PHI in logs, traces or metrics. | **PASS** | `http-exception.filter.ts`, `test/unit/email-privacy-sanitizer.spec.ts` |
| **V8.1** | Data protection at rest | PostgreSQL RLS via `fn_has_elder_access`, non-superuser role `eldercare_app`. | **PASS** | `infra/migrations/003_row_level_security.sql` |
| **V9.1** | Communications security | TLS 1.3 enforced, HSTS preload header, no plaintext HTTP permitted. | **PASS** | `main.ts`, security headers middleware |
| **V10.1**| Malicious code & trigger immutability| PostgreSQL triggers block `UPDATE` and `DELETE` on ledger & audit tables. | **PASS** | `infra/migrations/002_triggers_and_immutability.sql` |
| **V13.1**| API architecture & BOLA defense | Actor strictly extracted from authenticated session token; never request body. | **PASS** | `SessionAuthGuard.ts`, Policy Guard |
