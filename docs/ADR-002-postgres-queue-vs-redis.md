# ADR-002: PostgreSQL-Native Queue vs. Redis / BullMQ

## Status
ACCEPTED

## Context
Care events like missed doses, upcoming appointments, and refill alerts require background processing and multi-tier escalation ladders. If a database transaction commits an entity mutation (e.g., dose status marked missed) but the background queue job fails to enqueue (or vice-versa), critical alerts are permanently lost or phantom escalations fire.

## Decision
We use a PostgreSQL-native queue (pg-boss or transactional job table with `FOR UPDATE SKIP LOCKED`).
Background jobs are enqueued in the **exact same ACID transaction** as the entity state mutation.

## Rationale
1. **Transactional Atomicity**: Enqueueing is an `INSERT` into the queue table within the database transaction. If the transaction rolls back, the job disappears automatically. If it commits, the job is guaranteed to persist.
2. **Elimination of Dual-Write Hazards**: Prevents distributed race conditions where state changes succeed but Redis fails.
3. **Zero Additional Infrastructure**: Keeps PostgreSQL as the single source of truth and eliminates Redis operational overhead for small teams.

## Rejected Alternatives
- **Redis BullMQ**: Rejected because Redis cannot join a PostgreSQL transaction.
- **Apache Kafka / RabbitMQ**: Explicitly forbidden by architecture constraints; introduces extreme complexity.
