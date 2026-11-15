# ELDERCARE 360: External Penetration Testing Brief & Rules of Engagement

## 1. Executive Summary & Objective
This brief defines the scope, authorization, threat scenarios, and rules of engagement for an independent third-party penetration test of the **ELDERCARE 360** care-continuity platform.

The primary objective is to evaluate whether an attacker can violate core safety-critical and privacy non-negotiables:
1. Access elder health or adherence data without a valid, consented, and active grant.
2. Maintain access or extract data following elder consent revocation (testing the next-request revocation mandate).
3. Alter medication schedules, dosages, or drug entities without independent two-person authorization.
4. Tamper with or truncate the append-only adherence ledger or cryptographic audit hash-chain.
5. Induce alert suppression or silent escalation failure.

---

## 2. Scope & Target Environment

### In-Scope Assets
- **Web Application / PWA**: Hosted frontend at target staging endpoint (covering Elder Mode, Family Dashboard, Caregiver View).
- **RESTful API**: NestJS Modular Monolith (`apps/api`) and associated JSON/OpenAPI endpoints.
- **Session & Identity Engine**: Opaque 256-bit hashed token mechanics, device-bound PIN authentication, and WebAuthn handlers.
- **Cloud Firestore Persistence**: Firebase auth and user details document security rules.
- **PostgreSQL Row-Level Security (RLS)**: Enforced via `fn_has_elder_access` under non-superuser role `eldercare_app`.

### Out-of-Scope Assets
- Third-party infrastructure providers (Mailpit staging host, cloud network hypervisors).
- Denial of Service (DoS) attacks targeting network layer 3/4 flooding.
- Social engineering of clinical staff or actual elderly participants.

---

## 3. Test Personas & Test Credentials Provided

| Persona ID | Role | Device / Auth Type | Expected Access Ceiling |
| :--- | :--- | :--- | :--- |
| `pen-elder-01` | Elder | Registered Device PIN (Argon2id) | Full self-sovereignty; consent revocation; privacy toggle; emergency lock. |
| `pen-family-admin` | Family Primary | Opaque Session Cookie | View consented data; propose timing/routine edits; cannot approve own drug edits. |
| `pen-family-viewer` | Family Secondary | Opaque Session Cookie | Read-only view for consented scopes (`VIEW_MEDICATIONS`, `VIEW_ADHERENCE`). |
| `pen-caregiver-01` | Caregiver | Opaque Session Cookie | Task completion; handover notes; witnessing doses; no circle management. |
| `pen-revoked-user` | Former Member | Revoked Token / Stale Session | **Zero access (HTTP 401/403)** on the very next request. |
| `pen-unauthenticated` | Public / Attacker | No headers / forged tokens | Zero access; no user enumeration via auth endpoints. |

---

## 4. Key Attack Vectors & Priority Hypotheses

### Vector A: Broken Object Level Authorization (BOLA / IDOR)
- **Hypothesis**: Can a family member in Circle A query medicine obligations, appointments, or ledger rows belonging to Elder B in Circle B by manipulating UUID path parameters or bulk query filters?
- **Test Mandate**: Execute BOLA matrix across all `/api/v1/circle/:elderId/*` and `/api/v1/medications/:id` routes.

### Vector B: Next-Request Revocation Race Window
- **Hypothesis**: Can a caregiver whose grant was revoked at timestamp $T_0$ issue concurrent or pipelined requests at $T_0 + 50\text{ms}$ that succeed due to caching or session latency?
- **Test Mandate**: Verify database-backed opaque token revocation checks execute on every single inbound request with zero caching window.

### Vector C: Prescription Tampering & Proposer Approval Bypass
- **Hypothesis**: Can an authenticated family admin propose a medication strength change and immediately approve it themselves by spoofing request headers, calling internal approval endpoints, or omitting the verified document reference?

### Vector D: Cryptographic Hash-Chain Tampering & SQL Invariants
- **Hypothesis**: Can an adversary with application role access execute SQL `UPDATE` or `DELETE` on `dose_ledger` or `audit_log`, or forge entries that break the SHA-256 hash-chain without detection?

---

## 5. Rules of Engagement & Reporting
- **Emergency Halt**: If testing inadvertently impacts live clinical monitoring or exposes unintended data, halt immediately and notify `security-lead@eldercare360.local`.
- **Finding Severity Classification**: CVSS v3.1 scoring mapped to remediation SLAs:
  - **Critical (CVSS 9.0–10.0)**: 24-hour remediation.
  - **High (CVSS 7.0–8.9)**: 7-day remediation.
  - **Medium (CVSS 4.0–6.9)**: 30-day remediation.
