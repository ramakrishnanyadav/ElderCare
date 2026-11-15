export type CareRuleId =
  | 'R1_DOSE_UNCONFIRMED'
  | 'R2_MEDICINE_UNAVAILABLE'
  | 'R3_LATENCY_DRIFT'
  | 'R4_SILENCE_48H'
  | 'R5_MISSED_STREAK_3'
  | 'R6_STOCK_FORECAST'
  | 'R7_APPOINTMENT_UNPREPARED'
  | 'R8_REACHABILITY_BOUNCE';

export interface CareRuleEvaluation {
  ruleId: CareRuleId;
  ruleVersion: string; // e.g. "1.0.0"
  triggered: boolean;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  explanation: string;
  supportingRecordIds: string[];
  evidenceLimits: string;
  humanSignOffStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export class CareRulesEngine {
  static readonly RULE_VERSION = '1.0.0';

  // R1: Dose unconfirmed past grace window
  static evaluateR1(
    doseId: string,
    scheduledDueAt: Date,
    graceEndsAt: Date,
    now: Date,
    isConfirmed: boolean
  ): CareRuleEvaluation {
    const triggered = !isConfirmed && now.getTime() > graceEndsAt.getTime();
    return {
      ruleId: 'R1_DOSE_UNCONFIRMED',
      ruleVersion: this.RULE_VERSION,
      triggered,
      severity: 'WARNING',
      explanation: triggered
        ? `Scheduled dose was not confirmed within the clinical grace window (${graceEndsAt.toISOString()}). Escalation required.`
        : 'Dose is either confirmed or within the permissible grace window.',
      supportingRecordIds: [doseId],
      evidenceLimits: 'Based solely on timestamp comparison of physical PostgreSQL slot rows.',
      humanSignOffStatus: 'PENDING',
    };
  }

  // R2: Medicine unavailable (e.g. pharmacy stockout reported)
  static evaluateR2(medId: string, isStockoutReported: boolean): CareRuleEvaluation {
    return {
      ruleId: 'R2_MEDICINE_UNAVAILABLE',
      ruleVersion: this.RULE_VERSION,
      triggered: isStockoutReported,
      severity: 'CRITICAL',
      explanation: isStockoutReported
        ? 'Caregiver or pharmacy reported medicine unavailable in local inventory. Urgent procurement obligation required.'
        : 'Medicine available in household inventory.',
      supportingRecordIds: [medId],
      evidenceLimits: 'Derived from care member inventory exception report.',
      humanSignOffStatus: 'PENDING',
    };
  }

  // R3: Latency drift (per-person median + k x MAD over 3 days)
  static evaluateR3(
    elderId: string,
    intakeLatenciesMinutes: number[],
    currentLatencyMinutes: number,
    k: number = 3.0
  ): CareRuleEvaluation {
    if (intakeLatenciesMinutes.length < 3) {
      return {
        ruleId: 'R3_LATENCY_DRIFT',
        ruleVersion: this.RULE_VERSION,
        triggered: false,
        severity: 'INFO',
        explanation: 'Insufficient historical baseline entries to establish 3-day MAD statistics.',
        supportingRecordIds: [elderId],
        evidenceLimits: 'Requires at least 3 historical latency records.',
        humanSignOffStatus: 'PENDING',
      };
    }

    // Median
    const sorted = [...intakeLatenciesMinutes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Median Absolute Deviation (MAD)
    const absoluteDeviations = sorted.map((val) => Math.abs(val - median)).sort((a, b) => a - b);
    const mad = absoluteDeviations.length % 2 !== 0
      ? absoluteDeviations[mid]
      : (absoluteDeviations[mid - 1] + absoluteDeviations[mid]) / 2;

    const threshold = median + k * Math.max(mad, 10); // Minimum 10m floor
    const triggered = currentLatencyMinutes > threshold;

    return {
      ruleId: 'R3_LATENCY_DRIFT',
      ruleVersion: this.RULE_VERSION,
      triggered,
      severity: 'WARNING',
      explanation: triggered
        ? `Patient intake delay of ${currentLatencyMinutes}m exceeds statistical baseline (${median}m + ${k}x MAD threshold of ${Math.round(threshold)}m). Possible behavioral drift.`
        : `Intake latency of ${currentLatencyMinutes}m is within statistical baseline expectations.`,
      supportingRecordIds: [elderId],
      evidenceLimits: `Evaluated against ${intakeLatenciesMinutes.length} samples over rolling 3-day period.`,
      humanSignOffStatus: 'PENDING',
    };
  }

  // R4: Silence (48h without device check-in or sync)
  static evaluateR4(elderId: string, lastSeenAt: Date, now: Date): CareRuleEvaluation {
    const diffHours = (now.getTime() - lastSeenAt.getTime()) / (1000 * 60 * 60);
    const triggered = diffHours >= 48;

    return {
      ruleId: 'R4_SILENCE_48H',
      ruleVersion: this.RULE_VERSION,
      triggered,
      severity: 'CRITICAL',
      explanation: triggered
        ? `No device sync or patient activity observed in ${Math.round(diffHours)} hours. Exceeds 48h silence boundary.`
        : `Device active within past ${Math.round(diffHours)} hours.`,
      supportingRecordIds: [elderId],
      evidenceLimits: 'Derived from hardware-authenticated session activity timestamp.',
      humanSignOffStatus: 'PENDING',
    };
  }

  // R5: Missed streak (3 consecutive missed doses)
  static evaluateR5(elderId: string, recentOutcomes: string[]): CareRuleEvaluation {
    const lastThree = recentOutcomes.slice(-3);
    const triggered = lastThree.length === 3 && lastThree.every((o) => o === 'MISSED' || o === 'SKIPPED');

    return {
      ruleId: 'R5_MISSED_STREAK_3',
      ruleVersion: this.RULE_VERSION,
      triggered,
      severity: 'CRITICAL',
      explanation: triggered
        ? 'Three consecutive doses were marked MISSED or SKIPPED. Clinical review by on-call responder mandated.'
        : 'No 3-dose missed streak detected.',
      supportingRecordIds: [elderId],
      evidenceLimits: 'Derived from append-only adherence ledger records.',
      humanSignOffStatus: 'PENDING',
    };
  }

  // R6: Stock forecast (< 5 days remaining)
  static evaluateR6(
    medId: string,
    currentStock: number,
    dailyConsumption: number
  ): CareRuleEvaluation {
    const daysRemaining = dailyConsumption > 0 ? currentStock / dailyConsumption : 999;
    const triggered = daysRemaining <= 5.0;

    return {
      ruleId: 'R6_STOCK_FORECAST',
      ruleVersion: this.RULE_VERSION,
      triggered,
      severity: daysRemaining <= 2.0 ? 'CRITICAL' : 'WARNING',
      explanation: triggered
        ? `Projected stock depleted in ${daysRemaining.toFixed(1)} days (${currentStock} units remaining). Refill obligation required.`
        : `Sufficient stock for ${daysRemaining.toFixed(1)} days.`,
      supportingRecordIds: [medId],
      evidenceLimits: 'Linear burn-rate projection based on prescribed dosage frequency.',
      humanSignOffStatus: 'PENDING',
    };
  }

  // R7: Appointment unprepared (T-24h without completed prep tasks)
  static evaluateR7(
    appointmentId: string,
    appointmentTime: Date,
    prepTasks: { id: string; completed: boolean }[],
    now: Date
  ): CareRuleEvaluation {
    const hoursToAppt = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const uncompletedTasks = prepTasks.filter((t) => !t.completed);
    const triggered = hoursToAppt <= 24 && hoursToAppt > 0 && uncompletedTasks.length > 0;

    return {
      ruleId: 'R7_APPOINTMENT_UNPREPARED',
      ruleVersion: this.RULE_VERSION,
      triggered,
      severity: 'WARNING',
      explanation: triggered
        ? `Appointment is in ${Math.round(hoursToAppt)} hours, but ${uncompletedTasks.length} preparation task(s) remain incomplete.`
        : 'All preparation tasks completed or appointment window outside T-24h.',
      supportingRecordIds: [appointmentId],
      evidenceLimits: 'Checklist state from appointment record.',
      humanSignOffStatus: 'PENDING',
    };
  }

  // R8: Reachability (hard bounce or spam complaint)
  static evaluateR8(userId: string, email: string, isSuppressed: boolean): CareRuleEvaluation {
    return {
      ruleId: 'R8_REACHABILITY_BOUNCE',
      ruleVersion: this.RULE_VERSION,
      triggered: isSuppressed,
      severity: 'CRITICAL',
      explanation: isSuppressed
        ? `Communication channel for recipient (${email}) reported a permanent bounce or spam complaint. Fallback channel required.`
        : 'Recipient communication channel healthy.',
      supportingRecordIds: [userId],
      evidenceLimits: 'Delivery webhook reports from Mailpit/SES.',
      humanSignOffStatus: 'PENDING',
    };
  }
}
