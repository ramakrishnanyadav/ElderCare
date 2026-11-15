# ELDERCARE 360: Security Control Mapping (NIST CSF 2.0 & ISO 27001 Annex A)

## 1. NIST Cybersecurity Framework (CSF) 2.0 Mapping

| NIST CSF Function | Subcategory | ELDERCARE 360 Implementation | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **GOVERN (GV)** | GV.OC-01: Organizational context & clinical risk | DCB0129 Clinical Safety Case; ISO 14971 hazard register. | `CLINICAL_SAFETY_REGISTER.md` |
| **IDENTIFY (ID)** | ID.AM-01: Asset inventory & data classification | Strict 4-tier data classification (Identity, Health Data, Audit, Secrets). | `docs/security/threat-model.md` |
| **PROTECT (PR)** | PR.AA-01: Identity & access management | Device-bound PIN, WebAuthn passkeys, Argon2id, opaque tokens with next-request revocation. | `SessionAuthGuard.ts`, `PolicyEngine.ts` |
| **PROTECT (PR)** | PR.DS-01: Data at rest protection | Append-only SQL triggers; RLS via `eldercare_app`; SHA-256 hash chaining. | `002_triggers_and_immutability.sql` |
| **PROTECT (PR)** | PR.DS-02: Data in transit protection | Zero PHI in emails/logs; hard clinical keyword sanitization. | `test/unit/email-privacy-sanitizer.spec.ts` |
| **DETECT (DE)** | DE.CM-01: Tamper & anomaly detection | Cryptographic hash-chain verifier (`DatabaseService.verifyLedgerIntegrity`). | `test/unit/hash-chain-integrity.spec.ts` |
| **RESPOND (RS)** | RS.MA-01: Incident triage & containment | Per-patient emergency lock (`FREEZE_ALL_SHARING`); global token revocation. | `docs/security/runbooks.md` |
| **RECOVER (RC)**| RC.RP-01: Recovery execution | Point-in-time recovery test; RPO $\le 15\text{m}$, RTO $\le 4\text{h}$. | `docs/RUNBOOK.md` |

---

## 2. ISO/IEC 27001:2022 Annex A Control Index

- **A.5.15 Access Control**: Centralized `PolicyEngine` enforces least privilege and separation of duties.
- **A.5.17 Authentication Information**: No plain passwords; memory-hard Argon2id parameters.
- **A.5.33 Protection of Records**: DB triggers prohibit `UPDATE` and `DELETE` on adherence records and audit logs.
- **A.8.7 Protection Against Malware**: File upload size and MIME verification; attachment handling via signed short-lived URLs.
- **A.8.20 Network Security**: Egress filtering; Mailpit dev separation; database isolated from public internet.
- **A.8.24 Use of Cryptography**: Cryptographically secure PRNG for token generation; SHA-256 hash chaining.
