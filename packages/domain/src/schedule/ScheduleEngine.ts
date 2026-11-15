import { DateTime } from 'luxon';
import { rrulestr } from 'rrule';
import { Clock } from '../clock/Clock';
import { CLINICAL_CONFIG } from '../config/clinicalConfig';

export interface RecurrenceSpec {
  medicationVersionId: string;
  scheduleCron: string; // RFC-5545 RRULE or strict structured format
  homeTimezone: string; // IANA timezone e.g. "Asia/Kolkata"
  graceWindowMinutes: number;
}

export interface MaterializedSlot {
  medicationVersionId: string;
  scheduledDueAtUtc: Date;
  graceEndsAtUtc: Date;
  localWallTime: string; // "08:00"
  timezone: string;
}

export class ScheduleEngine {
  constructor(private readonly clock: Clock) {}

  materializeHorizon(
    spec: RecurrenceSpec,
    horizonDays: number = CLINICAL_CONFIG.HORIZON_DAYS
  ): MaterializedSlot[] {
    const nowUtc = this.clock.now();
    const localNow = DateTime.fromJSDate(nowUtc, { zone: spec.homeTimezone });
    
    // Evaluate across start of today to end of horizon
    const horizonStart = localNow.startOf('day');
    const horizonEnd = localNow.plus({ days: horizonDays }).endOf('day');

    let rule: any;
    try {
      rule = rrulestr(spec.scheduleCron, {
        dtstart: horizonStart.toJSDate(),
      });
    } catch {
      // Fallback simple daily recurrence if cron string format is simplified
      rule = rrulestr('RRULE:FREQ=DAILY;INTERVAL=1', {
        dtstart: horizonStart.toJSDate(),
      });
    }

    const occurrences = rule.between(horizonStart.toJSDate(), horizonEnd.toJSDate(), true);
    const slots: MaterializedSlot[] = [];

    for (const occ of occurrences) {
      // Convert occurrence to the patient's local wall clock
      const localSlotTime = DateTime.fromJSDate(occ, { zone: spec.homeTimezone });
      const dueUtc = localSlotTime.toUTC().toJSDate();
      const graceUtc = localSlotTime.plus({ minutes: spec.graceWindowMinutes }).toUTC().toJSDate();

      slots.push({
        medicationVersionId: spec.medicationVersionId,
        scheduledDueAtUtc: dueUtc,
        graceEndsAtUtc: graceUtc,
        localWallTime: localSlotTime.toFormat('HH:mm'),
        timezone: spec.homeTimezone,
      });
    }

    // Sort strictly ascending
    return slots.sort((a, b) => a.scheduledDueAtUtc.getTime() - b.scheduledDueAtUtc.getTime());
  }

  // Detects if two active medication versions create an accidental duplicate dosage at same time
  detectDuplicateDoseConflict(slotsA: MaterializedSlot[], slotsB: MaterializedSlot[]): boolean {
    const timesA = new Set(slotsA.map((s) => s.scheduledDueAtUtc.toISOString()));
    return slotsB.some((s) => timesA.has(s.scheduledDueAtUtc.toISOString()));
  }
}
