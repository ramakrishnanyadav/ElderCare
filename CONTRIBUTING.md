# Contributing to ELDERCARE 360

## 1. Quickstart Guide (5-Minute Local Setup)
1. **Prerequisites**: Node.js 20+, Docker Desktop.
2. **Clone & Install**:
   ```bash
   pnpm install
   ```
3. **Start Database & Mailpit**:
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```
4. **Seed Demo Data**:
   ```bash
   pnpm seed
   ```
5. **Run Development Servers**:
   ```bash
   # Terminal 1: NestJS API
   pnpm start:api
   # Terminal 2: Background Worker
   pnpm start:worker
   # Terminal 3: React PWA Frontend
   pnpm dev
   ```
6. **Open in Browser**:
   - Web App: `http://localhost:5173`
   - API Swagger Docs: `http://localhost:3000/docs`
   - Mailpit (Email Inspector): `http://localhost:8025`

---

## 2. Engineering Conventions
- **TypeScript Strict**: Zero `any`, zero non-null assertions (`!`), zero unhandled promise rejections.
- **Injected Clock**: Never use `new Date()` or `Date.now()` directly in domain or service logic. Pass an instance of `Clock`.
- **Policy Enforcement**: When creating a new endpoint, always add `@RequireAction(...)` with a corresponding action defined in `Action.ts` and `decisionTable.ts`.
- **Append-Only Data**: Never attempt to update or delete rows in `dose_ledger` or `audit_log`. Corrections must be appended as new rows referencing the original UUID.
