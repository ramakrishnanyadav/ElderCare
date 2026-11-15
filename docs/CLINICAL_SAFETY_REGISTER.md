# Clinical Safety Risk Register (DCB0129 / ISO 14971 Aligned)

## Scope
Evaluation of clinical hazards, failure modes, and safety countermeasures in ELDERCARE 360 care-continuity backend.

---

## Hazard Register

| Hazard ID | Clinical Hazard | Pre-Mitigation RPN (Sev x Lik) | Root Cause / Failure Mode | Engineered Countermeasure | Post-Mitigation RPN (Sev x Lik) | Sign-Off Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CLIN-01** | **Accidental Double-Dosing from Multiple Observers** | 5 x 3 = 15 (Critical) | Elder clicks "Taken" offline; caregiver records "Witnessed" online 10 minutes later. | The ledger is append-only with 5 distinct evidence grades. Concurrent reports are recorded as separate claims. Reconciliation flags temporal proximity without silently merging. | 5 x 1 = 5 (Acceptable) | **CLINICIAN SIGN-OFF REQUIRED** |
| **CLIN-02** | **Administration of Deprecated Toxic Dose via Stale Cache** | 5 x 3 = 15 (Critical) | Doctor discontinues medication due to adverse reaction; offline device continues presenting obsolete dose. | Discontinued versions immediately cease generation of future slots. Offline horizons hard-expire after 48 hours. | 5 x 1 = 5 (Acceptable) | **CLINICIAN SIGN-OFF REQUIRED** |
| **CLIN-03** | **Unilateral Dose Adjustment by Family Member** | 4 x 4 = 16 (Critical) | Family member modifies insulin or anticoagulant dose without doctor consultation. | Two-person rule enforced in code: Proposer cannot approve. Dosage edits require an attached verified prescription document reference. | 4 x 1 = 4 (Acceptable) | **CLINICIAN SIGN-OFF REQUIRED** |
| **CLIN-04** | **Delayed Emergency Escalation from Email Spam Filtering** | 4 x 4 = 16 (Critical) | Family primary responder misses missed-dose notice because it landed in spam. | Zero-knowledge email headers, SPF/DKIM/DMARC alignment, multi-tier fallback (SMS / phone call) when email is unacknowledged. | 4 x 1 = 4 (Acceptable) | **CLINICIAN SIGN-OFF REQUIRED** |
| **CLIN-05** | **Alert Fatigue Inducing Circle Non-Responsiveness** | 4 x 4 = 16 (Critical) | Repeated trivial alerts cause family to mute or ignore emergency notifications. | Deterministic silence detection: escalations cap at 3 tiers, after which an unresolved care breach is logged and digest frequency throttles. | 3 x 2 = 6 (Acceptable) | **CLINICIAN SIGN-OFF REQUIRED** |
| **CLIN-06** | **AI Hallucination in Clinical Schedule** | 5 x 4 = 20 (Critical) | LLM infers medicine dosage and hallucinates incorrect unit (e.g. 50mg vs 5mg). | **Non-Negotiable #2 & #7**: Zero LLM calls in backend. Schedules generated strictly from verified doctor prescription entries. | 5 x 1 = 5 (Acceptable) | **CLINICIAN SIGN-OFF REQUIRED** |

---

## Assumptions Flagged for Clinical & Legal Review

1. **[CLINICIAN SIGN-OFF REQUIRED] Grace Windows**:
   - Time-critical medications: 15 minutes.
   - Standard medications: 60 minutes.
   - Flexible medications: 120 minutes.
2. **[CLINICIAN SIGN-OFF REQUIRED] Stock Thresholds**:
   - Low stock warning: 5 days remaining.
   - Urgent stock warning: 2 days remaining.
3. **[NEEDS LEGAL REVIEW] Elder Capacity & Consent**:
   - Elder is presumed competent to grant or revoke consent under India DPDP Act 2023 unless a formal legal guardianship or Power of Attorney deed is uploaded.
4. **[NEEDS LEGAL REVIEW] Emergency Access (Break-Glass)**:
   - 60-minute maximum read-only emergency access with retrospective audit and notification to all family admins.
