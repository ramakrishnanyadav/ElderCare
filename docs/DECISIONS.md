# Architectural & Engineering Decisions (DECISIONS.md)

## 1. Context & Non-Negotiables
ELDERCARE 360 is a care-continuity platform for elderly care in India, where the elder (Kamala Devi) is at the center of every consent decision. Every care event is an accountable obligation with an owner, deadline, escalation path, and evidence-graded outcome.

## 2. Key Decisions & Rationales
- **Opaque 256-bit Hashed Sessions over JWT (ADR-001)**: Non-negotiable #1 & #3 mandate that revocation of consent, membership, or devices takes effect on the NEXT request. Stateless JWTs cannot be revoked instantly without distributed blacklists. Storing SHA-256 hashed 256-bit session tokens in PostgreSQL allows instant invalidation mid-session or mid-pagination.
- **Postgres-Native Job Queue over Redis (ADR-002)**: When state changes (e.g. schedule edit, missed dose), the background job MUST be enqueued in the exact same database transaction. Using Redis causes dual-write race conditions where state commits but the job drops, or vice versa. We use PostgreSQL-backed transactional enqueueing.
- **Pure Domain Engine with Injected Clock (ADR-005)**: No domain logic or policy evaluator calls `Date.now()` directly. An injected `Clock` interface allows 100% deterministic time-travel and property-based testing across DST boundaries, timezone shifts, and multi-day escalation ladders.
- **Strict Evidence Grading (Non-Negotiable #4)**: Never claim a medicine was taken from a button press. All adherence entries carry an `EvidenceGrade`: `PATIENT_REPORTED`, `CAREGIVER_WITNESSED`, `CLINICIAN_RECORDED`, `DEVICE_RECORDED`, `UNKNOWN`.
- **Append-Only Immutability with Cryptographic Hash Chaining (Non-Negotiable #5)**: Ledger and audit tables prohibit `UPDATE` and `DELETE` via SQL triggers. Corrections are append-only rows referencing the target row. Each record stores `previous_row_hash` computed over the preceding chain.
- **Zero-Knowledge Outbound Envelopes (Non-Negotiable #7)**: Outbound email subjects and bodies never contain drug names, dosages, conditions, or clinical data. Subjects read `"Eldercare 360: A reminder for Kamala is due"` with authenticated action links.
- **CLINICIAN SIGN-OFF REQUIRED & NEEDS LEGAL REVIEW**:
  - All grace windows (15m time-critical, 60m standard, 120m flexible) are tagged `CLINICIAN SIGN-OFF REQUIRED`.
  - Incapacity, legal guardianship, representative authority, and DPDP 2023 processing bases are tagged `NEEDS LEGAL REVIEW`.
