import React, { useState } from 'react';
import { useMockStore } from '../../store/mockStore';
import { StatusChip } from '../../components/common/StatusChip';
import { WitnessedDoseModal } from '../../components/caregiver/WitnessedDoseModal';
import { DoseSlot } from '../../types';

export const CaregiverTasksPage: React.FC = () => {
  const slots = useMockStore((s) => s.slots);
  const obligations = useMockStore((s) => s.obligations);
  const [activeSlot, setActiveSlot] = useState<DoseSlot | null>(null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Caregiver Daily Task Roster
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          Care recipient: Dhyanchand Sharma • Daytime Shift (08:00 AM – 06:00 PM)
        </p>
      </div>

      {/* Medication Administration Roster */}
      <section aria-labelledby="caregiver-doses-heading" className="card-premium rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="caregiver-doses-heading" className="font-bold text-base text-ink">
            Medication Doses Under Supervision
          </h2>
          <span className="text-xs text-ink-muted">Tap to record witnessed intake</span>
        </div>

        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className="p-4 bg-canvas rounded-card border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {slot.dueTime}
                  </span>
                  <StatusChip status={slot.status} size="sm" />
                </div>
                <h3 className="font-bold text-base text-ink">{slot.brandName}</h3>
                <p className="text-xs text-ink-secondary font-medium">{slot.dosageText}</p>
                <p className="text-[11px] text-ink-muted">{slot.instructions}</p>
              </div>

              {slot.status !== 'TAKEN' ? (
                <button
                  type="button"
                  onClick={() => setActiveSlot(slot)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-full transition-colors self-start sm:self-auto shrink-0 shadow-sm"
                >
                  👁️ Record Witnessed Intake
                </button>
              ) : (
                <div className="text-right self-start sm:self-auto">
                  <span className="text-xs font-bold text-emerald-800">✓ Recorded</span>
                  <div className="text-[10px] text-ink-muted">
                    {slot.evidenceGrade === 'CAREGIVER_WITNESSED' ? 'Witnessed by Caregiver' : 'Self-reported by Elder'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Assigned Care Obligations */}
      <section aria-labelledby="caregiver-obligations-heading" className="card-premium rounded-card p-5 space-y-3">
        <h2 id="caregiver-obligations-heading" className="font-bold text-base text-ink">
          Shift Assigned Duties
        </h2>
        <div className="divide-y divide-hairline">
          {obligations.map((ob) => (
            <div key={ob.id} className="py-3 flex items-start justify-between gap-3 text-xs">
              <div>
                <h3 className="font-bold text-ink">{ob.title}</h3>
                <p className="text-ink-secondary text-[11px] mt-0.5">{ob.closureCondition}</p>
              </div>
              <span className="shrink-0 text-teal-900 font-mono font-semibold">
                {ob.deadlineText}
              </span>
            </div>
          ))}
        </div>
      </section>

      <WitnessedDoseModal slot={activeSlot} onClose={() => setActiveSlot(null)} />
    </div>
  );
};
