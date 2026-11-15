# ADR-004: Strict Exclusion of LLMs from Safety-Critical Clinical Paths

## Status
ACCEPTED

## Context
Non-Negotiable #2 mandates "Verified data over AI inference. No LLM in the safety-critical path." Non-Negotiable #6 states "Never recommend, double, shift or substitute a dose. Clinical decisions belong to clinicians."

## Decision
Zero LLMs are executed in the core backend.
All schedules, adherence grading, escalation evaluations, and Doctor Visit Companion briefs are generated through deterministic TypeScript functions operating on verified PostgreSQL rows.

## Rationale
- Eliminates AI hallucination and prompt injection hazards.
- Guarantees 100% reproducible and legally defensible care audit trails under Indian healthcare and DPDP 2023 regulations.
