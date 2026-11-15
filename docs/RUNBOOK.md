# ELDERCARE 360: Operations & Incident Response Runbook

## 1. Quickstart & Deployment (One Command)
```bash
# 1. Bring up PostgreSQL 16 and Mailpit
docker compose -f infra/docker-compose.yml up -d

# 2. Run Database Migrations
pnpm migrate

# 3. Seed Demo World (Kamala Devi, Family of 3, Caregiver, 4 Meds, Escalation)
pnpm seed

# 4. Start API Server (Port 3000)
pnpm start:api

# 5. Start Worker Process
pnpm start:worker
```
- API Base URL: `http://localhost:3000/api/v1`
- Swagger / OpenAPI: `http://localhost:3000/api/docs`
- Mailpit UI (Email Inbox): `http://localhost:8025`

---

## 2. Invariant Monitoring & Alert Thresholds
The reconciler worker runs hourly invariant checks:
1. **No Overlapping Active Medication Versions**: Any medication with `COUNT(*) > 1` where `is_active = TRUE` triggers immediate SEV-1.
2. **Materialized Horizon Depth**: Any active patient schedule with `< 7 days` materialized triggers auto-regeneration.
3. **Unconfirmed Doses Past Grace Window**: Any slot where `NOW() > grace_ends_at` without an open obligation or resolved ledger record triggers alert recovery.
4. **Adherence Ledger Chain Integrity**: Validates `previous_row_hash` across all ledger rows. A single hash mismatch triggers failsafe read-only lockdown and immediate security ops paging.

---

## 3. Incident Playbooks

### Playbook A: Tamper Alert on Adherence Ledger
1. Identify affected patient ID from security log alert (`CRITICAL TAMPER ALERT`).
2. Run cryptographic chain verifier: `pnpm verify:ledger --patientId=<ID>`.
3. Locate row where `previous_row_hash != LAG(current_row_hash)`.
4. Freeze all automatic status changes for affected patient.
5. Notify primary on-call family admin via out-of-band telephone.

### Playbook B: Email Hard Bounce / Complaint
1. Webhook delivers `BOUNCE` or `COMPLAINT` to `/api/v1/notifications/webhook`.
2. System automatically marks recipient channel `SUPPRESSED`.
3. Escalation engine falls back to secondary responder SMS / push notification.
4. An accountable obligation `UPDATE_EMERGENCY_CONTACT_EMAIL` is assigned to Family Primary Admin.
