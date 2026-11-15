import React, { useState } from 'react';
import { useMockStore } from '../../store/mockStore';
import { StatusChip } from '../../components/common/StatusChip';
import { ProposeApproveModal } from '../../components/family/ProposeApproveModal';
import { Medicine } from '../../types';

export const FamilyMedicinesPage: React.FC = () => {
  const medicines = useMockStore((s) => s.medicines);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [pastMedsOpen, setPastMedsOpen] = useState(false);

  // CRITICAL SAFETY INVARIANT: Separate Active from Discontinued!
  // Discontinued medicines must NEVER appear under Active list!
  const activeMedicines = medicines.filter((m) => !m.isDiscontinued);
  const discontinuedMedicines = medicines.filter((m) => m.isDiscontinued);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Prescriptions & Schedule Governance
          </h1>
          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
            Routine timing edits apply with 24h undo. Drug and dosage edits require secondary sign-off.
          </p>
        </div>
      </div>

      {/* Active Medications Section */}
      <section aria-labelledby="active-meds-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="active-meds-heading" className="text-lg font-bold text-ink flex items-center gap-2">
            <span>Active Medications</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900">
              {activeMedicines.length} verified
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="active-medications-list">
          {activeMedicines.map((med) => (
            <div
              key={med.id}
              className="card-premium rounded-card p-5 space-y-4 border border-hairline flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Daily at {med.scheduleTime}
                    </span>
                    <h3 className="text-lg font-bold text-ink mt-1.5">{med.brandName}</h3>
                    <p className="text-xs text-ink-muted">{med.genericName}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="bg-canvas p-3 rounded-card text-xs text-ink-secondary font-medium">
                  {med.instructions}
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted pt-1">
                  <span>Stock Remaining:</span>
                  <strong className={med.stockCount <= 5 ? 'text-amber-700 font-bold' : 'text-ink'}>
                    {med.stockCount} doses {med.stockCount <= 5 ? '(Low Stock!)' : ''}
                  </strong>
                </div>
              </div>

              <div className="pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setSelectedMedicine(med)}
                  className="w-full py-2.5 bg-canvas hover:bg-teal-50 text-teal-900 font-bold text-xs rounded-full border border-hairline transition-colors"
                >
                  Edit Timing or Propose Dose Change →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past & Discontinued Medications (Collapsed Accordion) */}
      <section aria-labelledby="past-meds-heading" className="space-y-3 pt-4 border-t border-hairline">
        <button
          type="button"
          onClick={() => setPastMedsOpen(!pastMedsOpen)}
          className="w-full flex items-center justify-between p-4 bg-canvas hover:bg-slate-100 rounded-card border border-hairline text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-base" aria-hidden="true">🗄️</span>
            <div>
              <h2 id="past-meds-heading" className="font-bold text-sm text-ink">
                Past & Discontinued Medications
              </h2>
              <p className="text-xs text-ink-muted">
                {discontinuedMedicines.length} discontinued prescription(s)
              </p>
            </div>
          </div>
          <span className="text-sm font-bold text-ink-secondary">
            {pastMedsOpen ? '▲ Hide' : '▼ Show'}
          </span>
        </button>

        {pastMedsOpen && (
          <div className="space-y-3 p-4 bg-slate-50/70 rounded-card border border-hairline" data-testid="past-medications-list">
            {discontinuedMedicines.map((med) => (
              <div
                key={med.id}
                className="bg-surface p-4 rounded-card border border-hairline space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-ink line-through text-slate-500">
                      {med.brandName}
                    </h3>
                    <p className="text-xs text-ink-muted">{med.genericName}</p>
                  </div>
                  <StatusChip status="DISCONTINUED" size="sm" />
                </div>
                <div className="text-xs text-ink-secondary bg-canvas p-2.5 rounded border border-hairline">
                  {med.instructions}
                </div>
                <div className="text-[11px] text-ink-muted">
                  Discontinued on: {med.discontinuedDate}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ProposeApproveModal
        medicine={selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
      />
    </div>
  );
};
