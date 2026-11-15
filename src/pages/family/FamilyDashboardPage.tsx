import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMockStore } from '../../store/mockStore';
import { StatusChip } from '../../components/common/StatusChip';
import { EvidenceMixBar } from '../../components/common/EvidenceMixBar';
import { CareCirclePresence } from '../../components/family/CareCirclePresence';
import { EscalationLadder } from '../../components/family/EscalationLadder';
import { DoseSheet } from '../../components/elder/DoseSheet';
import { DoseSlot } from '../../types';

export const FamilyDashboardPage: React.FC = () => {
  const slots = useMockStore((s) => s.slots);
  const obligations = useMockStore((s) => s.obligations);
  const medicines = useMockStore((s) => s.medicines);
  const appointments = useMockStore((s) => s.appointments);
  const sharingPaused = useMockStore((s) => s.sharingPaused);

  const [selectedSlot, setSelectedSlot] = useState<DoseSlot | null>(null);

  // Exceptions
  const lowStockMeds = medicines.filter((m) => !m.isDiscontinued && m.stockCount <= m.refillThresholdDays);
  const dueSlots = slots.filter((s) => s.status === 'DUE');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner / Privacy Alert */}
      {sharingPaused && (
        <div className="p-4 bg-amber-100 border border-amber-300 rounded-card-lg text-amber-950 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span>🛡️</span>
            <span>Data sharing is currently paused by Dhyanchand ji. Displaying last verified cached snapshot.</span>
          </div>
          <span className="text-xs font-bold uppercase bg-amber-200 px-2.5 py-1 rounded-full">
            Paused
          </span>
        </div>
      )}

      {/* Header Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Family Care Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-teal-800 font-semibold mt-0.5">
            Dhyanchand Sharma • Elder Centered • Asia/Kolkata (IST)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            Active On-Call: Anita Sharma
          </span>
        </div>
      </div>

      {/* Actionable Exceptions Row (Refills, Pending Escalations) */}
      {lowStockMeds.length > 0 && (
        <div className="bg-[#FFF5E6] border border-amber-300 rounded-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden="true">⚠️</span>
            <div>
              <h3 className="font-bold text-sm text-amber-950">
                Medication Refill Obligation Triggered
              </h3>
              <p className="text-xs text-amber-900 mt-0.5">
                {lowStockMeds.map((m) => `${m.brandName} (${m.stockCount} doses left)`).join(', ')}. Stock is under 5-day safety threshold.
              </p>
            </div>
          </div>
          <Link
            to="/obligations"
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-full font-bold text-xs shrink-0 self-start sm:self-auto transition-colors"
          >
            View Refill Obligation →
          </Link>
        </div>
      )}

      {/* Today's Medication Timeline Strip */}
      <div className="card-premium rounded-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-ink text-base">Today's Routine Timeline</h3>
            <p className="text-xs text-ink-muted">4 scheduled doses today</p>
          </div>
          <Link to="/medicines" className="text-xs font-bold text-teal-800 hover:underline">
            Manage Schedules →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {slots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelectedSlot(slot)}
              className="p-3.5 rounded-card bg-canvas hover:bg-slate-100 border border-hairline text-left transition-all space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-teal-900">{slot.dueTime}</span>
                <StatusChip status={slot.status} size="sm" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-ink group-hover:text-teal-900 transition-colors">
                  {slot.brandName}
                </h4>
                <p className="text-[11px] text-ink-muted truncate">{slot.dosageText}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Signature Feature 3: Segmented Evidence-Mix Bar */}
      <EvidenceMixBar />

      {/* Two Column Grid: Care Circle Presence & Active Obligations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CareCirclePresence />

        {/* Obligations Summary */}
        <div className="card-premium rounded-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink text-base">Care Obligations</h3>
              <p className="text-xs text-ink-muted">Accountable tasks with named owners</p>
            </div>
            <Link to="/obligations" className="text-xs font-bold text-teal-800 hover:underline">
              View All ({obligations.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {obligations.map((ob) => (
              <div key={ob.id} className="p-3.5 rounded-card bg-canvas border border-hairline space-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-ink">{ob.title}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      ob.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {ob.status}
                  </span>
                </div>
                <div className="text-ink-secondary">
                  Owner: <strong className="text-ink">{ob.ownerName}</strong> ({ob.ownerRole})
                </div>
                <div className="text-teal-900 font-semibold font-mono text-[11px]">
                  Deadline: {ob.deadlineText}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Escalation Ladder in Progress */}
      <EscalationLadder />

      <DoseSheet slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
    </div>
  );
};
