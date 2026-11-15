import { CareRulesEngine } from '@eldercare/domain';

describe('17. Care Rules Engine (R1 to R8 Positive, Negative, Boundary Cases)', () => {
  const now = new Date('2026-11-15T10:00:00.000Z');

  describe('R1: Dose Unconfirmed', () => {
    it('Positive: Triggered when now > grace_ends_at and not confirmed', () => {
      const graceEnd = new Date('2026-11-15T08:45:00.000Z');
      const evalRes = CareRulesEngine.evaluateR1('dose-1', new Date('2026-11-15T08:00:00.000Z'), graceEnd, now, false);
      expect(evalRes.triggered).toBe(true);
      expect(evalRes.explanation).toContain('not confirmed within the clinical grace window');
    });

    it('Negative: Not triggered when confirmed', () => {
      const graceEnd = new Date('2026-11-15T08:45:00.000Z');
      const evalRes = CareRulesEngine.evaluateR1('dose-1', new Date('2026-11-15T08:00:00.000Z'), graceEnd, now, true);
      expect(evalRes.triggered).toBe(false);
    });

    it('Boundary: Not triggered when exactly at grace_ends_at', () => {
      const graceEnd = new Date(now.getTime());
      const evalRes = CareRulesEngine.evaluateR1('dose-1', new Date('2026-11-15T08:00:00.000Z'), graceEnd, now, false);
      expect(evalRes.triggered).toBe(false);
    });
  });

  describe('R2: Medicine Unavailable', () => {
    it('Positive: Triggered when stockout reported', () => {
      const evalRes = CareRulesEngine.evaluateR2('med-1', true);
      expect(evalRes.triggered).toBe(true);
      expect(evalRes.severity).toBe('CRITICAL');
    });

    it('Negative: Not triggered when available', () => {
      const evalRes = CareRulesEngine.evaluateR2('med-1', false);
      expect(evalRes.triggered).toBe(false);
    });
  });

  describe('R3: Latency Drift (3-day MAD)', () => {
    it('Positive: Triggered when intake delay exceeds median + 3x MAD', () => {
      // Historical latencies: 5m, 8m, 10m, 12m, 15m (median = 10, deviations = 5, 2, 0, 2, 5 -> MAD = 2)
      // Floor MAD = 10 -> threshold = 10 + 3 * 10 = 40m.
      const evalRes = CareRulesEngine.evaluateR3('elder-1', [5, 8, 10, 12, 15], 55, 3.0);
      expect(evalRes.triggered).toBe(true);
      expect(evalRes.explanation).toContain('exceeds statistical baseline');
    });

    it('Negative: Within baseline', () => {
      const evalRes = CareRulesEngine.evaluateR3('elder-1', [5, 8, 10, 12, 15], 18, 3.0);
      expect(evalRes.triggered).toBe(false);
    });
  });

  describe('R4: Silence (48h without sync)', () => {
    it('Positive: Triggered at >= 48 hours without sync', () => {
      const lastSeen = new Date(now.getTime() - 49 * 60 * 60 * 1000);
      const evalRes = CareRulesEngine.evaluateR4('elder-1', lastSeen, now);
      expect(evalRes.triggered).toBe(true);
      expect(evalRes.explanation).toContain('Exceeds 48h silence boundary');
    });

    it('Negative: Active 12 hours ago', () => {
      const lastSeen = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const evalRes = CareRulesEngine.evaluateR4('elder-1', lastSeen, now);
      expect(evalRes.triggered).toBe(false);
    });
  });

  describe('R5: Missed Streak (3 consecutive missed)', () => {
    it('Positive: Triggered on 3 consecutive MISSED/SKIPPED doses', () => {
      const evalRes = CareRulesEngine.evaluateR5('elder-1', ['TAKEN', 'MISSED', 'SKIPPED', 'MISSED']);
      expect(evalRes.triggered).toBe(true);
      expect(evalRes.severity).toBe('CRITICAL');
    });

    it('Negative: Broken streak', () => {
      const evalRes = CareRulesEngine.evaluateR5('elder-1', ['MISSED', 'SKIPPED', 'TAKEN']);
      expect(evalRes.triggered).toBe(false);
    });
  });

  describe('R6: Stock Forecast (< 5 days remaining)', () => {
    it('Positive: Triggered when stock <= 5 days', () => {
      const evalRes = CareRulesEngine.evaluateR6('med-3', 4, 1.0); // 4 days remaining
      expect(evalRes.triggered).toBe(true);
      expect(evalRes.explanation).toContain('Refill obligation required');
    });

    it('Negative: Stock sufficient for 20 days', () => {
      const evalRes = CareRulesEngine.evaluateR6('med-1', 20, 1.0);
      expect(evalRes.triggered).toBe(false);
    });
  });

  describe('R7: Appointment Unprepared', () => {
    it('Positive: Triggered within T-24h with incomplete prep tasks', () => {
      const apptTime = new Date(now.getTime() + 18 * 60 * 60 * 1000); // 18h away
      const prepTasks = [{ id: 'p1', completed: false }];
      const evalRes = CareRulesEngine.evaluateR7('apt-1', apptTime, prepTasks, now);
      expect(evalRes.triggered).toBe(true);
    });

    it('Negative: All prep tasks completed', () => {
      const apptTime = new Date(now.getTime() + 18 * 60 * 60 * 1000);
      const prepTasks = [{ id: 'p1', completed: true }];
      const evalRes = CareRulesEngine.evaluateR7('apt-1', apptTime, prepTasks, now);
      expect(evalRes.triggered).toBe(false);
    });
  });

  describe('R8: Reachability Bounce', () => {
    it('Positive: Triggered on suppressed channel', () => {
      const evalRes = CareRulesEngine.evaluateR8('user-1', 'anita@example.com', true);
      expect(evalRes.triggered).toBe(true);
      expect(evalRes.severity).toBe('CRITICAL');
    });

    it('Negative: Healthy communication channel', () => {
      const evalRes = CareRulesEngine.evaluateR8('user-1', 'anita@example.com', false);
      expect(evalRes.triggered).toBe(false);
    });
  });
});
