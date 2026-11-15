# ELDERCARE 360: Security Incident Response Runbooks

## Runbook 1: Credential Compromise & Session Hijacking
1. **Detection**: User reports unfamiliar login or anomaly detector flags impossible travel / high failure burst.
2. **Immediate Containment**:
   - Execute per-user token revocation:
     `UPDATE sessions SET revoked_at = NOW(), revocation_reason = 'INCIDENT_CREDENTIAL_COMPROMISE' WHERE user_id = :userId;`
   - Invalidate all active device bindings for the affected account.
3. **Investigation**: Query `audit_log` for actions performed during the suspicious window using the user's `actor_id`.
4. **Remediation**: Re-issue single-use invite passcode with 24h expiry; require passkey/PIN re-enrollment.

---

## Runbook 2: Suspected Protected Health Data Exposure
1. **Detection**: Sentinel string detected in application logs, third-party error tracking, or outbound email.
2. **Immediate Containment**:
   - Trigger Emergency Notification Kill Switch:
     `UPDATE app_feature_flags SET enabled = false WHERE flag_name = 'EMAIL_DISPATCH_ENABLED';`
3. **Assessment & Forensics**:
   - Identify the exact code path that bypassed `EmailProvider` or logging redaction.
   - Run cryptographic leak audit across Mailpit and log streams.
4. **Notification**:
   - Assess regulatory disclosure requirements under applicable data protection laws (`NEEDS LEGAL REVIEW`).

---

## Runbook 3: Malicious Insider / Database Tampering
1. **Detection**: Cryptographic verifier (`DatabaseService.verifyLedgerIntegrity`) detects hash-chain mismatch.
2. **Containment**:
   - Freeze all non-essential writes to the affected circle:
     `UPDATE circles SET status = 'SECURITY_FROZEN' WHERE id = :circleId;`
3. **Forensics**:
   - Compare database checkpoint with external signed audit anchor.
   - Identify the exact modified or injected row via `previous_row_hash` discrepancy.
4. **Recovery**:
   - Restore affected partition from validated point-in-time backup.
   - Replay verified transactional outbox events.

---

## Runbook 4: Emergency Lock & Global Kill Switches
- **Elder Emergency Lock**:
  The elder taps "Emergency Lock" in their client $\to$ sets `elder_privacy_mode = 'EMERGENCY_LOCK'`.
  Effect: All family and caregiver queries return HTTP 403 Forbidden on the next request. Safety-critical emergency services remain accessible.
- **Global Session Kill Switch**:
  In the event of an active vulnerability in session parsing:
  `UPDATE sessions SET revoked_at = NOW() WHERE revoked_at IS NULL;`
  Forces 100% of active web and mobile clients to re-authenticate.
