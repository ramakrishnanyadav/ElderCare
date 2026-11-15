import * as fc from 'fast-check';
import { DateTime } from 'luxon';
import { ScheduleEngine, DoseScheduleConfig } from '../../packages/domain/ScheduleEngine';

/**
 * Independent Reference Implementation (Differential Oracle)
 * Deliberately simple minute-by-minute walk over a timeline to determine valid slot matches.
 */
function referenceGenerateDoses(
  times: string[], // ["08:00", "20:00"]
  startDateIso: string,
  endDateIso: string,
  timezone: string
): string[] {
  const results: string[] = [];
  let current = DateTime.fromISO(startDateIso, { zone: timezone }).startOf('day');
  const end = DateTime.fromISO(endDateIso, { zone: timezone }).endOf('day');

  while (current <= end) {
    for (const timeStr of times) {
      const [h, m] = timeStr.split(':').map(Number);
      const slot = current.set({ hour: h, minute: m, second: 0, millisecond: 0 });
      if (slot.isValid && slot >= DateTime.fromISO(startDateIso, { zone: timezone }) && slot <= end) {
        results.push(slot.toISO()!);
      }
    }
    current = current.plus({ days: 1 });
  }

  return results.sort();
}

describe('Schedule Engine Differential & Metamorphic Tests', () => {
  const targetTimezones = [
    'Asia/Kolkata',
    'America/New_York',
    'Europe/London',
    'Australia/Lord_Howe',
  ];

  it('matches reference implementation across varied timezones and multi-dose regimens', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...targetTimezones),
        fc.constantFrom(
          ['08:00'],
          ['09:00', '21:00'],
          ['07:30', '13:00', '20:30']
        ),
        fc.integer({ min: 1, max: 14 }), // horizon days
        (tz, times, horizonDays) => {
          const start = DateTime.now().setZone(tz).startOf('day');
          const end = start.plus({ days: horizonDays }).endOf('day');

          const config: DoseScheduleConfig = {
            medicineId: 'med-test',
            times,
            timezone: tz,
            startDate: start.toISO()!,
            endDate: end.toISO()!,
          };

          const realOutput = ScheduleEngine.generateDoseSlots(config, start.toISO()!, end.toISO()!);
          const refOutput = referenceGenerateDoses(times, start.toISO()!, end.toISO()!, tz);

          expect(realOutput.length).toBe(refOutput.length);
          for (let i = 0; i < realOutput.length; i++) {
            const dtReal = DateTime.fromISO(realOutput[i], { zone: tz });
            const dtRef = DateTime.fromISO(refOutput[i], { zone: tz });
            expect(dtReal.hasSame(dtRef, 'minute')).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('Metamorphic Invariants', () => {
    it('regenerating horizon for unchanged schedule is strictly idempotent', () => {
      const start = '2026-11-15T00:00:00.000Z';
      const end = '2026-11-22T23:59:59.999Z';
      const config: DoseScheduleConfig = {
        medicineId: 'med-idempotent',
        times: ['08:00', '20:00'],
        timezone: 'Asia/Kolkata',
        startDate: start,
      };

      const pass1 = ScheduleEngine.generateDoseSlots(config, start, end);
      const pass2 = ScheduleEngine.generateDoseSlots(config, start, end);

      expect(pass1).toEqual(pass2);
    });

    it('discontinued medicine generates zero future dose events', () => {
      const start = '2026-11-15T00:00:00.000Z';
      const end = '2026-11-22T23:59:59.999Z';
      const config: DoseScheduleConfig = {
        medicineId: 'med-discontinued',
        times: ['08:00'],
        timezone: 'Asia/Kolkata',
        startDate: start,
        isDiscontinued: true,
      };

      const slots = ScheduleEngine.generateDoseSlots(config, start, end);
      expect(slots).toEqual([]);
    });
  });
});
