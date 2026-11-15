# ADR-003: Modular Monolith Architecture (apps/api + apps/worker)

## Status
ACCEPTED

## Context
A safety-critical healthcare platform requires strict consistency, atomic transactions across domain boundaries, and high reliability without microservice orchestration overhead.

## Decision
Build as a modular monolith split into two runnable processes:
1. `apps/api`: NestJS HTTP application serving the versioned REST API.
2. `apps/worker`: Dedicated background runner scanning scheduled jobs, running reconcilers, and dispatching alerts.
Both applications share `@eldercare/domain` and `@eldercare/contracts`.

## Rationale
- Allows strict module encapsulation.
- Facilitates end-to-end integration testing in a single process without network mocks.
- Keeps deployment simple via Docker Compose.
