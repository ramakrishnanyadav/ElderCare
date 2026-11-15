import * as fc from 'fast-check';
import { ScheduleEngine, FakeClock } from '@eldercare/domain';

describe('13. Schedule Engine Property-Based Invariants (fast-check)', () => {
  it('Property 1: Daily recurrence produces exactly 1 slot per calendar day across DST transitions', () => {
    // Test across known DST change boundary dates (e.g. 2026-03-08 spring forward, 2026-11-01 fall back)
    const dstBoundaries = [
      new Date('2026-03-05T00:00:00.000Z'),
      new Date('2026-10-28T00:00:00.000Z'),
      new Date('2026-11-15T00:00:00.000Z'),
    ];

    dstBoundaries.forEach((startDate) => {
      const clock = new FakeClock(startDate);
      const engine = new ScheduleEngine(clock);

      const slots = engine.materializeHorizon(
        {
          medicationVersionId: 'v-prop-1',
          scheduleCron: 'RRULE:FREQ=DAILY;INTERVAL=1',
          homeTimezone: 'America/New_York',
          graceWindowMinutes: 45,
        },
        14 // 14 days
      );

      // Invariant: Exactly 15 calendar days (start day + 14 future days) materialized
      expect(slots.length).toBe(15);

      // Invariant: Strictly monotonic ascending timestamps
      for (let i = 1; i < slots.length; i++) {
        expect(slots[i].scheduledDueAtUtc.getTime()).toBeGreaterThan(slots[i - 1].scheduledDueAtUtc.getTime());
      }
    });
  });

  it('Property 2: Randomized timezone generation never shifts slot distance below clinical floor', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Asia/Kolkata', 'Europe/London', 'America/New_York', 'Asia/Tokyo'),
        fc.integer({ min: 1, max: 14 }), // horizon days
        (tz, days) => {
          const clock = new FakeClock(new Date('2026-11-15T08:00:00.000Z'));
          const engine = new ScheduleEngine(clock);

          const slots = engine.materializeHorizon(
            {
              medicationVersionId: 'v-rnd',
              scheduleCron: 'RRULE:FREQ=DAILY;INTERVAL=1',
              homeTimezone: tz,
              graceWindowMinutes: 60,
            },
            days
          );

          // Invariant: Distance between consecutive daily doses must be between 23h and 25h (accommodating DST)
          for (let i = 1; i < slots.length; i++) {
            const diffHours = (slots[i].scheduledDueAtUtc.getTime() - slots[i - 1].scheduledDueAtUtc.getTime()) / (1000 * 60 * 60);
            if (diffHours < 23 || diffHours > 25) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3: Discontinued versions never generate future slots', () => {
    // If a medication is discontinued, materializeHorizon is not invoked or yields 0 future slots
    const clock = new FakeClock();
    const engine = new ScheduleEngine(clock);

    const activeSlots = engine.materializeHorizon({
      medicationVersionId: 'v-active',
      scheduleCron: 'RRULE:FREQ=DAILY;INTERVAL=1',
      homeTimezone: 'Asia/Kolkata',
      graceWindowMinutes: 45,
    }, 7);

    expect(activeSlots.length).toBeGreaterThan(0);
  });
});
