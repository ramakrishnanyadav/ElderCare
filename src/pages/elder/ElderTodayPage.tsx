import React, { useState } from 'react';
import { useMockStore } from '../../store/mockStore';
import { StatusChip } from '../../components/common/StatusChip';
import { DoseSheet } from '../../components/elder/DoseSheet';
import { DoseSlot } from '../../types';

export const ElderTodayPage: React.FC = () => {
  const slots = useMockStore((s) => s.slots);
  const [activeSlot, setActiveSlot] = useState<DoseSlot | null>(null);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Today's Medicine Schedule
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Review and confirm your doses for today. Every dose reflects verified records.
        </p>
      </div>

      <div className="space-y-4">
        {slots.map((slot) => {
          return (
            <div
              key={slot.id}
              className="card-premium rounded-card-lg p-5 sm:p-6 space-y-4 border border-hairline hover:border-teal-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      {slot.dueTime} • {slot.timeCategory}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink">{slot.brandName}</h3>
                  <p className="text-sm font-medium text-ink-secondary">{slot.dosageText}</p>
                </div>
                <StatusChip status={slot.status} size="lg" />
              </div>

              <div className="bg-canvas p-3 rounded-card border border-hairline text-xs sm:text-sm text-ink-secondary font-medium">
                {slot.instructions}
              </div>

              <button
                type="button"
                onClick={() => setActiveSlot(slot)}
                className="w-full min-h-[56px] text-base font-bold rounded-full bg-teal-800 hover:bg-teal-900 text-white shadow-btn-teal transition-all active:scale-[0.98]"
              >
                {slot.status === 'TAKEN' ? 'View Recorded Details' : 'Take This Medicine →'}
              </button>
            </div>
          );
        })}
      </div>

      <DoseSheet slot={activeSlot} onClose={() => setActiveSlot(null)} />
    </div>
  );
};
