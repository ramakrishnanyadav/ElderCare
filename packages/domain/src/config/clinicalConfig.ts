/**
 * =========================================================================
 * CLINICAL SAFETY DEFAULT CONFIGURATION
 * =========================================================================
 * ALL THRESHOLDS AND GRACE WINDOWS BELOW REQUIRE FORMAL HUMAN SIGN-OFF
 * BY A LICENSED CLINICIAN BEFORE PRODUCTION DEPLOYMENT.
 * DO NOT ALTER WITHOUT DOCUMENTED CLINICAL JUSTIFICATION.
 * =========================================================================
 */

export const CLINICAL_CONFIG = {
  // Grace Windows prior to initiating family escalation ladder
  GRACE_WINDOWS_MINUTES: {
    TIME_CRITICAL: 15, // Insulin, Heparin, Parkinson's meds (CLINICIAN SIGN-OFF REQUIRED)
    STANDARD: 60,      // Antihypertensives, Oral Antidiabetics (CLINICIAN SIGN-OFF REQUIRED)
    FLEXIBLE: 120,     // Vitamins, Supplements (CLINICIAN SIGN-OFF REQUIRED)
  },

  // Multi-tier escalation offsets past grace period end
  ESCALATION_OFFSETS_MINUTES: {
    TIER_0_ELDER_DUE: 0,
    TIER_1_GRACE_END_FOLLOWUP: 0, // Fires at due_at + grace_window
    TIER_2_PRIMARY_ON_CALL: 30,  // +30m post grace end
    TIER_3_SECONDARY_BROADCAST: 60, // +60m post grace end
  },

  // Stock inventory depletion thresholds
  STOCK_ALERTS: {
    LOW_STOCK_DAYS: 5,   // Triggers routine refill obligation (CLINICIAN SIGN-OFF REQUIRED)
    CRITICAL_STOCK_DAYS: 2, // Triggers urgent high-priority obligation (CLINICIAN SIGN-OFF REQUIRED)
  },

  // Appointment timeline offsets relative to appointment slot
  APPOINTMENT_TIMELINE_HOURS: {
    PREPARATION_TASK_OFFSET_HOURS: -48, // T-48h
    REMINDER_PRIMARY_HOURS: -24,        // T-24h
    REMINDER_URGENT_HOURS: -2,          // T-2h
    POST_VISIT_RECONCILE_HOURS: 2,       // T+2h
  },

  // Materialization horizon for future schedules
  HORIZON_DAYS: 14,

  // Max offline schedule horizon cache before mandatory connectivity lockout
  OFFLINE_CACHE_HARD_EXPIRY_HOURS: 48, // (CLINICIAN SIGN-OFF REQUIRED)
} as const;
