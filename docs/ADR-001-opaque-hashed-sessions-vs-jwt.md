# ADR-001: Opaque 256-bit Hashed Sessions vs. JSON Web Tokens (JWT)

## Status
ACCEPTED

## Context
ELDERCARE 360 enforces Non-Negotiable #1 ("Elder autonomy over family convenience. Access is consented, scoped, time-boxable and revocable. Revocation applies on the NEXT request.") and Non-Negotiable #3 ("Revocation of grants, membership, devices and sessions takes effect on the NEXT request, including mid-pagination.").

## Decision
We use opaque cryptographically secure 256-bit random tokens stored as SHA-256 hashes in PostgreSQL (`sessions` table).
Clients transmit the token via `HttpOnly`, `Secure`, `SameSite=Lax` cookies or `Authorization: Bearer` headers.
Every incoming request queries or validates the session state against PostgreSQL.

## Rationale
1. **Immediate Revocation**: Stateless JWTs cannot be revoked until their expiration time elapses, unless a distributed token blacklist is checked on every request (which negates the primary stateless benefit of JWTs).
2. **Elder Privacy Barrier**: If Kamala Devi revokes consent for a caregiver or family member, that member's access must terminate instantly on their very next HTTP request, even if they are in the middle of browsing a paginated list.
3. **Database-backed Invalidation**: Deleting or setting `revoked_at = NOW()` on the session row immediately terminates access without propagation delays.

## Rejected Alternatives
- **Stateless JWT with Short Expiry (e.g. 5 minutes)**: Rejected because a 5-minute window permits unauthorized access to sensitive health data after an elder explicitly clicks "Revoke" or "Pause Sharing".
- **JWT with Redis Blacklist**: Rejected because it introduces Redis as an additional failure mode and state synchronization requirement.
