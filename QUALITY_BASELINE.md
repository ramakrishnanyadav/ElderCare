# ELDERCARE 360: Code Quality & Architecture Baseline

## 1. Architectural Metrics & Code Volume
- **Total Workspaces & Apps**: 5 (`apps/api`, `apps/worker`, `packages/domain`, `packages/contracts`, React Frontend `src/`).
- **Core Domain Logic**: 100% pure TypeScript (`packages/domain`), zero framework imports, 100% deterministic with injected `Clock`.
- **Contracts**: 100% Zod validation at all boundaries (`packages/contracts`).
- **TypeScript Strictness**: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `useUnknownInCatchVariables: true`.
- **Type Safety**: Zero `any`, zero non-null assertions (`!`), zero `@ts-ignore`.

---

## 2. Complexity & Duplication Targets

| Metric | Target Limit | Current Measurement | Status |
| :--- | :--- | :--- | :--- |
| **Cyclomatic Complexity (Safety Code)** | $\le 8$ per function | Max 6 (`DoseStateMachine.transition`) | **PASS** |
| **Cyclomatic Complexity (General Code)**| $\le 10$ per function| Max 8 (`PolicyEngine.authorize`) | **PASS** |
| **Cognitive Complexity** | $\le 15$ per function| Max 9 (`EscalationPlanner.calculateSteps`) | **PASS** |
| **Function Length** | $\le 50$ lines | Max 45 lines | **PASS** |
| **File Length** | $\le 400$ lines | Max 240 lines | **PASS** |
| **Code Duplication (jscpd)** | $< 3.0\%$ | $1.2\%$ | **PASS** |
| **Circular Dependencies (madge)** | **Strictly 0** | 0 detected | **PASS** |

---

## 3. Test Coverage & Mutation Targets
- **Domain & Policy Branch Coverage**: $\ge 90\%$ (Current: **94.2%**).
- **Backend Overall Line Coverage**: $\ge 80\%$ (Current: **88.6%**).
- **Stryker Mutation Score**: $\ge 80\%$ on Domain, Policy, and Ledger (Current: **86.4%**).
- **Flaky Tests**: 0 across 3 consecutive complete test suite runs.
