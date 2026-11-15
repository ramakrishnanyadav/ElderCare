# ELDERCARE 360: System Architecture & Module Boundaries

## 1. Architectural Philosophy & Constraints
ELDERCARE 360 is engineered as a **Modular Monolith** with a distinct background worker process, adhering strictly to safety-critical healthcare software engineering principles:
1. **Zero LLM in Safety-Critical Path**: All scheduling, dose state machine transitions, escalation ladders, and access controls are 100% deterministic code.
2. **Pure Domain Logic Isolation (`packages/domain`)**: Core business rules (Schedules, Dose State Machine, Policy Engine, Care Rules, Escalation) have **zero framework dependencies** and require an injected `Clock` interface for 100% deterministic testing.
3. **Contracts as Single Source of Truth (`packages/contracts`)**: Zod schemas govern all boundaries (REST API inputs/outputs, frontend query types, OpenAPI generation).
4. **Append-Only Immutability in PostgreSQL**: The adherence ledger and audit log prohibit SQL `UPDATE` and `DELETE` via database triggers, reinforced by cryptographic SHA-256 hash chaining.
5. **Two-Tier Authorization**: Primary authorization is enforced by `PolicyEngine.authorize` on every request. PostgreSQL Row-Level Security (RLS) via non-superuser role `eldercare_app` provides defense-in-depth.

---

## 2. Component Diagram

```mermaid
graph TD
    subgraph Frontend["Frontend Layer (React PWA)"]
        ElderUI["Elder Experience (Simple Mode / 56px+ Targets)"]
        FamilyUI["Family Dashboard (Proposals & Evidence-Mix)"]
        CaregiverUI["Caregiver View (Tasks & Handovers)"]
        PWAStore["Zustand Store + TanStack Query"]
    end

    subgraph Boundaries["Contract & Boundary Layer"]
        Contracts["@eldercare/contracts (Zod Schemas + Typed API Client)"]
    end

    subgraph CoreBackend["Backend Modular Monolith (apps/api)"]
        AuthModule["Auth Module (Passkeys / Argon2id / Sessions)"]
        PolicyGuard["PolicyGuard (@RequireAction Enforcement)"]
        CircleModule["Circle & Consent Module"]
        MedsModule["Medication & Prescriptions Module"]
        DoseModule["Dose Ledger & Evidence Module"]
        ApptModule["Appointments & Visit Companion"]
    end

    subgraph PureDomain["Domain Core (packages/domain)"]
        Clock["Clock Interface (SystemClock / FakeClock)"]
        ScheduleEngine["ScheduleEngine (IANA Timezones & DST)"]
        DoseSM["DoseStateMachine (10 States & Evidence Grades)"]
        PolicyEngine["PolicyEngine (Decisions Table & 2-Person Rule)"]
        EscalationPlanner["EscalationPlanner (Cadence & Quiet Hours)"]
    end

    subgraph WorkerProcess["Worker Process (apps/worker)"]
        JobRunner["JobRunner (FOR UPDATE SKIP LOCKED)"]
        Reconciler["HourlyInvariantsReconciler (4 Invariants)"]
        EmailService["EmailProvider (Hard Clinical Keyword Sanitizer)"]
        Canary["SyntheticCanaryRunner (5m Health Heartbeat)"]
    end

    subgraph PersistenceLayer["Storage & Database Layer"]
        Postgres[(PostgreSQL 16)]
        Triggers["Append-Only DB Triggers"]
        RLS["Row-Level Security Policies"]
        Firestore[(Firebase Cloud Firestore)]
    end

    Frontend --> Contracts
    Contracts --> CoreBackend
    CoreBackend --> PureDomain
    WorkerProcess --> PureDomain
    CoreBackend --> Postgres
    WorkerProcess --> Postgres
    Postgres --- Triggers
    Postgres --- RLS
    Frontend --> Firestore
```

---

## 3. Module Boundaries & Enforcement Rules
1. `packages/domain` **MUST NOT** import NestJS, Express, React, Prisma, or `@eldercare/contracts`.
2. `apps/api` and `apps/worker` **MUST NOT** import from each other. They communicate solely via PostgreSQL transactional job queue.
3. Every controller route in `apps/api` **MUST** declare an `@RequireAction(Action)` decorator; enforced at startup by `verify-route-actions.ts`.
4. Domain logic **MUST NOT** call `Date.now()` or `new Date()`. Time must be acquired through the injected `Clock` instance.
