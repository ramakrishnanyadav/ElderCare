import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface TimeTravelState {
  offsetMinutes: number;
  simulatedTime: Date;
  isEscalating: boolean;
  activeTier: number; // 0 = normal, 1 = grace ended, 2 = primary responder (+75m), 3 = secondary responder (+105m)
}

export const TimeTravelDemoControl: React.FC = () => {
  const queryClient = useQueryClient();
  const [offsetMinutes, setOffsetMinutes] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [baseTime] = useState<Date>(new Date());

  const simulatedDate = new Date(baseTime.getTime() + offsetMinutes * 60 * 1000);

  const getTier = (mins: number) => {
    if (mins >= 105) return 3;
    if (mins >= 75) return 2;
    if (mins >= 45) return 1;
    return 0;
  };

  const activeTier = getTier(offsetMinutes);

  const advanceTime = (minutes: number) => {
    const newOffset = offsetMinutes + minutes;
    setOffsetMinutes(newOffset);

    // Invalidate queries so UI immediately re-evaluates schedules, missed doses, and obligations
    queryClient.invalidateQueries();
  };

  const resetTime = () => {
    setOffsetMinutes(0);
    queryClient.invalidateQueries();
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {isOpen ? (
        <div className="bg-surface rounded-card-lg border border-hairline shadow-2xl p-4 w-72 space-y-3 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <span className="text-base">⏱️</span>
              <span>Time-Travel Demo Control</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ink-muted hover:text-ink text-sm p-1"
              aria-label="Close time travel"
            >
              ✕
            </button>
          </div>

          <div className="bg-canvas p-2 rounded-card space-y-1">
            <p className="text-[11px] text-ink-muted uppercase font-bold tracking-wider">
              Simulated Clock
            </p>
            <p className="font-mono text-sm font-bold text-teal-900">
              {simulatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[10px] text-ink-secondary">
              Offset: <span className="font-bold">+{offsetMinutes} min</span>
            </p>
          </div>

          {/* Active Escalation Ladder Status */}
          <div className="p-2 rounded-card border text-[11px] space-y-1 bg-amber-50 border-amber-200 text-amber-900 font-semibold">
            <div className="flex items-center justify-between">
              <span>Escalation Ladder:</span>
              <span className="font-bold">
                {activeTier === 0
                  ? 'Tier 0 (Due Now / Grace)'
                  : activeTier === 1
                  ? 'Tier 1 (Grace Ended / Missed)'
                  : activeTier === 2
                  ? 'Tier 2 (Primary +30m)'
                  : 'Tier 3 (Secondary/Caregiver +60m)'}
              </span>
            </div>
            <p className="text-[10px] text-amber-800 font-normal">
              {activeTier === 0
                ? 'Elder self-resolution window active.'
                : activeTier === 1
                ? 'Obligation triggered. Follow-up reminder sent.'
                : activeTier === 2
                ? 'Escalated to Anita Sharma (Daughter).'
                : 'Escalated to Rahul Sharma & Sunita Devi.'}
            </p>
          </div>

          {/* Fast-Forward Actions */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-bold text-ink-secondary uppercase">
              Fast-Forward Cadence
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => advanceTime(45)}
                className="py-1.5 px-2 rounded-card bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold border border-teal-200 transition-colors"
                title="Advance to Grace Period Expiration (+45 min)"
              >
                +45m (Grace End)
              </button>
              <button
                type="button"
                onClick={() => advanceTime(30)}
                className="py-1.5 px-2 rounded-card bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold border border-teal-200 transition-colors"
                title="Advance to Primary Escalation (+75 min total)"
              >
                +30m (Primary)
              </button>
              <button
                type="button"
                onClick={() => advanceTime(30)}
                className="py-1.5 px-2 rounded-card bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold border border-teal-200 transition-colors"
                title="Advance to Secondary Escalation (+105 min total)"
              >
                +30m (Secondary)
              </button>
              <button
                type="button"
                onClick={resetTime}
                className="py-1.5 px-2 rounded-card bg-canvas hover:bg-slate-200 text-ink-secondary font-bold border border-hairline transition-colors"
                title="Reset simulated clock to real local time"
              >
                Reset Clock
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 py-2 px-3.5 rounded-full bg-surface border border-hairline shadow-lg hover:shadow-xl text-teal-900 font-bold transition-all hover:scale-105 active:scale-95 text-xs"
          title="Open Dev Time-Travel Controls"
        >
          <span className="text-sm">⏱️</span>
          <span>Time-Travel ({offsetMinutes > 0 ? `+${offsetMinutes}m` : 'Live'})</span>
          {activeTier > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </button>
      )}
    </div>
  );
};
