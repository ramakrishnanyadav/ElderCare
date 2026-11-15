import React from 'react';
import { useMockStore } from '../../store/mockStore';

export const EscalationLadder: React.FC = () => {
  const steps = useMockStore((s) => s.escalationSteps);

  return (
    <div className="card-premium rounded-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink text-base">Active Escalation Ladder</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Deterministic notification sequence for missed or delayed intakes.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 animate-pulse">
          Tier 2 In Progress
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-hairline">
        {steps.map((step) => {
          const isAck = step.status === 'ACKNOWLEDGED';
          const isSent = step.status === 'SENT';
          const isPending = step.status === 'PENDING';

          return (
            <div key={step.tier} className="relative flex items-start justify-between gap-4">
              {/* Dot on vertical line */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isAck
                    ? 'bg-[#1E7A45] border-white text-white'
                    : isSent
                    ? 'bg-[#12605A] border-white text-white'
                    : 'bg-white border-[#6B7776] text-transparent'
                }`}
              >
                {isAck && (
                  <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                )}
                {isSent && !isAck && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    Tier {step.tier}
                  </span>
                  <h4 className="text-sm font-semibold text-ink">{step.label}</h4>
                </div>
                <p className="text-xs text-ink-secondary mt-1">
                  Recipient: <strong className="text-ink">{step.recipientName}</strong> via{' '}
                  <span className="font-mono text-[11px] text-ink-muted">{step.channel}</span>
                </p>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isAck
                      ? 'text-[#1E7A45] bg-[#EAF5EF] border-[#1E7A45]/30'
                      : isSent
                      ? 'text-[#12605A] bg-[#DAEEEC] border-[#12605A]/30'
                      : 'text-[#6B7776] bg-canvas border-hairline'
                  }`}
                >
                  {step.status}
                </span>
                <div className="text-[11px] text-ink-muted mt-1 tabular-nums">
                  {step.timestampText}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
