import { DateTime } from 'luxon';
import { CLINICAL_CONFIG } from '../config/clinicalConfig';

export interface PlannedEscalationStep {
  tier: number;
  triggerTimeUtc: Date;
  recipientRole: 'ELDER' | 'PRIMARY_ON_CALL' | 'SECONDARY_CIRCLE';
  label: string;
  isQuietHoursOverridden: boolean;
}

export interface EscalationPlanParams {
  dueAtUtc: Date;
  homeTimezone: string;
  isTimeCritical: boolean;
  graceWindowMinutes: number;
  quietHoursStartLocalHour?: number; // default 22 (10 PM)
  quietHoursEndLocalHour?: number;   // default 7 (7 AM)
}

export class EscalationPlanner {
  static planEscalation(params: EscalationPlanParams): PlannedEscalationStep[] {
    const dueTime = DateTime.fromJSDate(params.dueAtUtc, { zone: params.homeTimezone });
    const graceEndTime = dueTime.plus({ minutes: params.graceWindowMinutes });
    const primaryOnCallTime = graceEndTime.plus({ minutes: CLINICAL_CONFIG.ESCALATION_OFFSETS_MINUTES.TIER_2_PRIMARY_ON_CALL });
    const secondaryTime = graceEndTime.plus({ minutes: CLINICAL_CONFIG.ESCALATION_OFFSETS_MINUTES.TIER_3_SECONDARY_BROADCAST });

    const quietStart = params.quietHoursStartLocalHour ?? 22;
    const quietEnd = params.quietHoursEndLocalHour ?? 7;

    const isQuiet = (dt: DateTime): boolean => {
      const h = dt.hour;
      return h >= quietStart || h < quietEnd;
    };

    const steps: PlannedEscalationStep[] = [
      {
        tier: 0,
        triggerTimeUtc: dueTime.toUTC().toJSDate(),
        recipientRole: 'ELDER',
        label: 'T0: Scheduled Due Prompt',
        isQuietHoursOverridden: params.isTimeCritical,
      },
      {
        tier: 1,
        triggerTimeUtc: graceEndTime.toUTC().toJSDate(),
        recipientRole: 'ELDER',
        label: 'Tier 1: Grace Window Expired Follow-up',
        isQuietHoursOverridden: params.isTimeCritical,
      },
      {
        tier: 2,
        triggerTimeUtc: primaryOnCallTime.toUTC().toJSDate(),
        recipientRole: 'PRIMARY_ON_CALL',
        label: 'Tier 2: Primary Responder Escalation (+30m)',
        isQuietHoursOverridden: params.isTimeCritical || !isQuiet(primaryOnCallTime),
      },
      {
        tier: 3,
        triggerTimeUtc: secondaryTime.toUTC().toJSDate(),
        recipientRole: 'SECONDARY_CIRCLE',
        label: 'Tier 3: Care Circle Broadcast (+60m)',
        isQuietHoursOverridden: params.isTimeCritical || !isQuiet(secondaryTime),
      },
    ];

    return steps;
  }
}
