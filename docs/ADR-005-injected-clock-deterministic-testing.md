# ADR-005: Injected Clock Interface for Deterministic Time and Property Testing

## Status
ACCEPTED

## Context
Time-sensitive scheduling, daylight saving transitions, grace periods, multi-tier escalation intervals (+30m, +60m), and hourly reconcilers are notoriously brittle when coupled to system wall-clock `Date.now()`.

## Decision
All domain logic, state machines, and schedule engines must accept an injected `Clock` interface:
```typescript
export interface Clock {
  now(): Date;
  iso(): string;
  epochMs(): number;
}
```
Production code injects `SystemClock`. Test suites inject `FakeClock` with programmable time advancement. Direct calls to `Date.now()`, `new Date()`, or `setTimeout` are forbidden in `@eldercare/domain`.

## Rationale
- Allows deterministic testing of complex temporal scenarios (e.g. 48-hour offline silence, DST fall-back 25h days, multi-tier alert cadences) in milliseconds without `sleep()` delays.
- Enables fast-check property-based testing across thousands of randomized historical and future timestamps.
