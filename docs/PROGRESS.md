# ELDERCARE 360 Backend: Build Progress

## Build Stages (Strict Build Order)
- [x] Step 1: Threat model (OWASP API Top 10 mapped), ADRs, repo scaffold, Docker Compose (Postgres 16, Mailpit), schema & migrations (UUID, UTC + IANA, constraints, triggers, RLS), test harness with real Postgres.
- [ ] Step 2: Authentication: credentials, devices (WebAuthn/PIN), sessions, lockout, rate limits, invites (Crockford base32).
- [ ] Step 3: Care circle, consents, policy module, decision table, generated matrix, route-action check, serializers, RLS, audit and hash chain, access ledger.
- [ ] Step 4: Medications, versions, proposals & approvals, schedule engine, dose events, state machine, ledger, adherence.
- [ ] Step 5: Worker: scheduler, notifications, escalation, obligations, digests, retry, dead-letter, bounce handling, reconciler, canary.
- [ ] Step 6: Care rules (R1–R8), inventory & refills, appointments, Visit Companion, tasks, handover.
- [ ] Step 7: Offline sync, emergency access, Privacy mode, recovery, privacy requests and export.
- [ ] Step 8: OpenAPI and typed client, seed script (Kamala Devi world), observability, hardening, docs & runbook.
- [ ] Step 9: Full verification, test suites, and final report.
