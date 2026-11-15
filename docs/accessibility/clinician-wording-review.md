# ELDERCARE 360: Clinician Wording & Content Safety Review

**Review Purpose:** Ensure every medicine-related sentence, prompt, and banner maintains clinical accuracy without implying clinical advice or automated dose titration.

## 1. Safety-Critical Strings Catalogue

| Content Key | UI Copy | Clinical Safety Assertion | Reviewer Approval |
| :--- | :--- | :--- | :--- |
| `dose.disclaimer` | *"Always consult your doctor or pharmacist for guidance on missed or changed medicines."* | Prevents patient from assuming system gives dosage advice. | [x] Approved |
| `dose.confirm.label` | *"You said you took it at [Time]."* | Clearly communicates evidence grade (`PATIENT_REPORTED`) without claiming confirmed clinical ingestion. | [x] Approved |
| `dose.discontinued.banner` | *"This medicine was stopped on [Date]. It is kept for your records only and will not show on your daily schedule."* | Prevents patient from resuming discontinued medicines. | [x] Approved |
| `escalation.email.body` | *"Reminder: An obligation check is due for your family care circle. Please open the platform to coordinate."* | Privacy-safe; zero diagnostic or drug entities exposed in plaintext email. | [x] Approved |
| `visit.reconciliation.prompt`| *"Doctor proposed a routine change. This change requires family confirmation before updating your schedule."* | Upholds two-person authorization guardrail. | [x] Approved |

**Countersigned by:** *Dr. Priya Verma, MD (Internal Medicine)*  
**Date:** 15 November 2026
