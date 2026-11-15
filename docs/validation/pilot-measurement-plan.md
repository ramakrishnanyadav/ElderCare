# ELDERCARE 360: Pilot Measurement Plan (Digital-Twin & Real Pilot)

## 1. Executive Summary & Purpose
This document establishes the empirical instrumentation, telemetry baselines, key performance indicators (KPIs), and decision thresholds for evaluating ELDERCARE 360 across both the 25-family Digital-Twin simulation (Layer 3) and subsequent real-world family cohort trials.

---

## 2. Primary Safety & Efficacy Metrics

| Metric Code | Metric Name | Definition | Target Threshold | Hard Failure Gate |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | **Timely Notification Dispatch** | % of due medication and appointment reminders dispatched within $\le 60\text{s}$ of scheduled time. | $\ge 98.0\%$ | $< 95.0\%$ |
| **M2** | **Acknowledgement Latency** | Median time from unconfirmed dose (grace expiration) to human caregiver acknowledgement. | $\le 45\text{ min}$ | $> 120\text{ min}$ |
| **M3** | **Unowned Escalations** | Count of open escalation ladders lacking an assigned active human responder. | **Strictly 0** | $> 0$ |
| **M4** | **Duplicate Email Alerts** | Redundant notification deliveries for the identical obligation event. | **Strictly 0** | $> 0$ |
| **M5** | **Committed Event Integrity** | Doses, logs, or obligations acknowledged by client but dropped in persistence. | **Strictly 0** | $> 0$ |
| **M6** | **Evidence Grade Completeness** | % of dose ledger entries carrying a valid, non-null `EvidenceGrade`. | **100% (0 untagged)** | $< 100\%$ |
| **M7** | **Zero-Authorization Leak** | Cross-patient reads or unauthorized data access attempts permitted. | **Strictly 0** | $> 0$ |
| **M8** | **Offline Sync Reconciliation** | % of offline captured dose events reconciled without lost updates upon reconnection. | **100%** | $< 99.5\%$ |

---

## 3. Telemetry Architecture & Privacy Safeguards
- **In-Memory & Database Aggregation**: Telemetry queries aggregate counts, durations, and state transitions using anonymous UUID references.
- **Redaction Engine**: The logging interceptor (`pino-http`) redacts all medication names, doses, family names, and contact credentials from metric tags.
- **Audit Table Verification**: All metrics are calculated directly from the append-only `dose_ledger`, `audit_log`, and `jobs` tables using tamper-evident cryptographic hash verification.

---

## 4. 25-Family Digital-Twin Simulation Matrix
The simulation harness subjects the complete system (API, Worker, Postgres, Mailpit) to 30 continuous simulated days across 25 diverse family archetypes:
1. **Diligent Elder (5 families)**: Confirms doses within 5 minutes of due time.
2. **Forgetful / Late Elder (5 families)**: Confirms late (at grace margin or during Tier 1 escalation).
3. **Inactive / Digital Silence Elder (3 families)**: Never opens client; tests deterministic escalation ladder and reachability.
4. **Intermittent Connectivity Elder (4 families)**: Disconnects for 24h to 72h periods; queues offline events; syncs upon reconnection.
5. **Timezone Traveler Elder (2 families)**: Shifts from Asia/Kolkata to Europe/London; tests DST & timezone shifts.
6. **Caregiver Handover Circle (3 families)**: Caregiver reassigns responsibility mid-escalation.
7. **Adversarial / Revoked Member (3 families)**: Member access is revoked mid-day; immediate rejection on subsequent query.

---

## 5. Go / No-Go Decision Gate Criteria
A release is certified **GO** for real-world family enrollment only when:
- All 20 simulation random seeds complete 30 days without a single invariant failure.
- Zero untagged doses (`EvidenceGrade` null = 0).
- Zero unowned escalations.
- Zero duplicate emails.
- Tamper verifier reports 100% cryptographic ledger integrity.
