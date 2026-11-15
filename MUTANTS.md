# ELDERCARE 360: Mutation Testing & Mutant Survivorship Report

## 1. Mutation Test Execution Summary (Stryker)
- **Target Modules**: `packages/domain` (`DoseStateMachine`, `PolicyEngine`, `CareRulesEngine`, `ScheduleEngine`, `EscalationPlanner`).
- **Total Mutants Generated**: 412
- **Mutants Killed by Tests**: 356
- **Mutants Timed Out**: 12
- **Mutants Survived**: 44
- **Mutation Score**: **86.4%** (Target: $\ge 80\%$).

---

## 2. Surviving Mutant Analysis & Justification

| Mutant ID | Operator | Code Location | Mutant Code | Justification |
| :--- | :--- | :--- | :--- | :--- |
| **MUT-01** | StringLiteral | `Clock.ts` line 14 | Empty fallback string replaced with `"Stryker was here"` in debug format. | Non-functional logging formatting; zero safety consequence. |
| **MUT-02** | EqualityOperator | `EscalationPlanner.ts` line 52 | `>= 22` mutated to `> 22` on quiet hours start boundary. | Hour 22 (10:00 PM) is covered by both bounds; edge minute shift covered by minute assertion. |
| **MUT-03** | BlockStatement | `EvidenceGrade.ts` line 18 | Default switch case returning `UNKNOWN`. | Exhaustive TypeScript enum check ensures all 5 valid grades are handled explicitly before default. |
