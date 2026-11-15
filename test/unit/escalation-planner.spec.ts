import { EscalationPlanner, FakeClock } from '@eldercare/domain';

describe('15. Escalation Planner & Multi-Tier Timing Cadence', () => {
  it('Plans exact cadence: T0 (Elder), T+45m (Grace End), T+75m (Primary on-call), T+105m (Circle broadcast)', () => {
    const dueAt = new Date('2026-11-15T08:00:00.000Z');
    const steps = EscalationPlanner.planEscalation({
      dueAtUtc: dueAt,
      homeTimezone: 'Asia/Kolkata',
      isTimeCritical: false,
      graceWindowMinutes: 45, // default 45m grace
    });

    expect(steps.length).toBe(4);

    // Tier 0
    expect(steps[0].tier).toBe(0);
    expect(steps[0].recipientRole).toBe('ELDER');
    expect(steps[0].triggerTimeUtc.toISOString()).toBe('2026-11-15T08:00:00.000Z');

    // Tier 1 (Grace End)
    expect(steps[1].tier).toBe(1);
    expect(steps[1].recipientRole).toBe('ELDER');
    expect(steps[1].triggerTimeUtc.toISOString()).toBe('2026-11-15T08:45:00.000Z');

    // Tier 2 (Primary On-Call +30m post grace)
    expect(steps[2].tier).toBe(2);
    expect(steps[2].recipientRole).toBe('PRIMARY_ON_CALL');
    expect(steps[2].triggerTimeUtc.toISOString()).toBe('2026-11-15T09:15:00.000Z');

    // Tier 3 (Secondary Circle +60m post grace)
    expect(steps[3].tier).toBe(3);
    expect(steps[3].recipientRole).toBe('SECONDARY_CIRCLE');
    expect(steps[3].triggerTimeUtc.toISOString()).toBe('2026-11-15T09:45:00.000Z');
  });

  it('Quiet Hours Override: Time-critical medicine overrides nighttime quiet hours', () => {
    // 11 PM dose
    const lateDueAt = new Date('2026-11-15T23:00:00.000Z');

    const standardSteps = EscalationPlanner.planEscalation({
      dueAtUtc: lateDueAt,
      homeTimezone: 'Asia/Kolkata',
      isTimeCritical: false,
      graceWindowMinutes: 45,
    });
    // For standard medicine, nighttime alerts do not override quiet hours
    expect(standardSteps[2].isQuietHoursOverridden).toBe(false);

    const timeCriticalSteps = EscalationPlanner.planEscalation({
      dueAtUtc: lateDueAt,
      homeTimezone: 'Asia/Kolkata',
      isTimeCritical: true, // Insulin / time-critical
      graceWindowMinutes: 15,
    });
    // For time-critical medicine, quiet hours ARE overridden!
    expect(timeCriticalSteps[2].isQuietHoursOverridden).toBe(true);
  });
});
