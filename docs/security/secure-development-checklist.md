# ELDERCARE 360: Secure Development & Engineering Checklist

Every engineer contributing to ELDERCARE 360 must verify this checklist before merging pull requests.

---

## 1. Authentication & Session Hygiene
- [x] **Actor Identity**: `actorId` and `userRole` are extracted **exclusively from the authenticated session context** (`req.user`). Never accept an `actorId` from request bodies, query strings, or client headers.
- [x] **Session Storage**: Session tokens must be opaque 256-bit crypto-random strings, hashed with SHA-256 at rest in PostgreSQL. Never store raw tokens in databases or JWT payloads on client devices.
- [x] **Cookie Flags**: All session cookies must enforce `__Host-` prefix, `HttpOnly`, `Secure`, `SameSite=Strict`, and `Path=/`.

---

## 2. Authorization & Policy Enforcement
- [x] **Action Declaration**: 100% of controller methods must declare an `@RequireAction(Action)` decorator. CI audit script (`verify-route-actions.ts`) fails the build if any route is missing.
- [x] **Central Policy Engine**: Authorization is decided exclusively by `PolicyEngine.authorize`. Never write custom ad-hoc role checks in controller bodies.
- [x] **Two-Person Rule**: Prescription and dosage modifications require `proposerId !== approverId` and a non-empty `verifiedDocumentRef`.
- [x] **Row-Level Security**: All PostgreSQL operations must execute under the non-superuser application role `eldercare_app` with `fn_has_elder_access` RLS policy active.

---

## 3. Cryptography & Data Protection
- [x] **No Custom Cryptography**: Use established primitives: Argon2id for password/PIN hashing, libsodium / AES-256-GCM for envelope encryption, Ed25519 for external checkpoint signing.
- [x] **AAD Binding**: When encrypting data fields, always include `PatientId` and `FieldName` as Additional Authenticated Data (AAD) to prevent ciphertext copying across records.
- [x] **Append-Only Immutability**: Adherence records and audit rows must never be updated or deleted. Database triggers block `UPDATE` and `DELETE`.

---

## 4. Input Validation & Communications Hygiene
- [x] **Zod Strict Parsing**: Every DTO must be parsed with `.strict()` schemas that reject unknown or unexpected payload properties.
- [x] **Zero PHI in Transport**: Outbound emails, logs, metric tags, traces, and error messages must never contain medication names, dosages, or clinical diagnoses. All notification copy must pass through `EmailProvider.sanitizeEmailContent`.
