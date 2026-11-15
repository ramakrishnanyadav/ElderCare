# ELDERCARE 360: Residual Risk Register & Human Sign-Off Boundaries

## 1. Executive Summary
In compliance with DCB0129 and ISO 14971 standards for clinical software systems, automated testing provides mathematical proof of code contracts, deterministic logic, and cryptographic integrity. However, automation **CANNOT** prove real-world human factors, clinical safety in edge medical cases, or legal validity.

This document identifies all residual risks requiring explicit human sign-off prior to broad production release.

---

## 2. Residual Risk Catalogue

| Risk ID | Category | Description | Mitigating Technical Control | Residual Risk & Human Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **RR-01** | **Clinical** | A narrow therapeutic index medication (e.g. Warfarin, Digoxin, Insulin) is treated with standard 45-minute grace window. | System tags defaults with `CLINICIAN SIGN-OFF REQUIRED` and allows per-medication tighter grace limits. | **CLINICAL SIGN-OFF**: Treating physician must review and approve patient-specific grace windows for narrow therapeutic drugs. |
| **RR-02** | **Human Usability** | An elder with advanced Parkinson's tremor experiences difficulty maintaining a 600ms hold gesture. | System provides accessible single-tap button alternative and 10-minute undo countdown. | **HUMAN OBSERVATION**: In-person usability evaluation using `docs/validation/elder-usability-protocol.md` with tremor cohort. |
| **RR-03** | **Legal & Regulatory** | Applicability of digital consent and data fiduciary responsibilities under the India Digital Personal Data Protection (DPDP) Act. | Consent-as-code ledger, plain-language transparency log, one-touch privacy pause. | **LEGAL REVIEW**: Independent legal counsel must review circle consent grants and terms of service (`NEEDS LEGAL REVIEW`). |
| **RR-04** | **Infrastructure & IAM** | Production cloud database misconfiguration permitting non-TLS connections or superuser leak. | `init-db.sql` creates dedicated non-superuser role `eldercare_app` without `BYPASSRLS`; TLS enforced. | **CLOUD AUDIT**: Pre-deployment cloud security posture review (CSPM) of production AWS/GCP VPC and KMS. |
| **RR-05** | **Independent Red-Team** | Novel zero-day vulnerability in web runtime or third-party dependency. | ASVS Level 3 controls, Semgrep SAST, dependency lockfile pins, tamper-evident hash chaining. | **EXTERNAL PEN TEST**: Execution of authorized penetration test per `docs/validation/pen-test-brief.md`. |
