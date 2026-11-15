import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMockStore } from '../../store/mockStore';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';
import { DayRing } from '../../components/elder/DayRing';
import { DoseSheet } from '../../components/elder/DoseSheet';
import { HoldToConfirmButton } from '../../components/elder/HoldToConfirmButton';
import { ElderHelpModal } from '../../components/elder/ElderHelpModal';
import { StatusChip } from '../../components/common/StatusChip';
import { DoseSlot } from '../../types';

export const ElderHomePage: React.FC = () => {
  const language = useUserStore((s) => s.language);
  const t = translations[language].elder;
  const slots = useMockStore((s) => s.slots);
  const markDoseTaken = useMockStore((s) => s.markDoseTaken);

  const [selectedSlot, setSelectedSlot] = useState<DoseSlot | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Find next due or pending dose
  const nextDose = slots.find((s) => s.status === 'DUE') || slots.find((s) => s.status === 'NOT_YET') || slots[0];

  const handleNextDoseConfirm = async () => {
    if (nextDose) {
      await markDoseTaken(nextDose.id, 'PATIENT_REPORTED');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Top Elder Greeting & Emergency Quick Dial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            {t.greeting}
          </h1>
          <p className="text-sm font-medium text-teal-800 mt-1">
            {nextDose.status === 'DUE'
              ? `Next dose due at ${nextDose.dueTime}`
              : t.allClear}
          </p>
        </div>

        {/* High-visibility Call Family Button (min 56px height) */}
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="min-h-[56px] px-6 rounded-full bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-rose-900 font-bold text-base flex items-center justify-center gap-2.5 transition-transform active:scale-95 shadow-sm self-start sm:self-auto"
        >
          <span className="text-xl" aria-hidden="true">📞</span>
          <span>{t.callFamily}</span>
        </button>
      </div>

      {/* Signature Feature 1: 24-Hour Day Ring */}
      <DayRing slots={slots} onSelectSlot={(slot) => setSelectedSlot(slot)} />

      {/* Hero Next Dose Card with Hold-to-Confirm */}
      {nextDose && (
        <section aria-labelledby="next-medicine-heading" className="card-premium rounded-card-lg p-6 sm:p-8 space-y-5 border-2 border-teal-700/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-900 bg-teal-100 px-3 py-1 rounded-full border border-teal-300">
                  {t.nextDose} • {nextDose.dueTime}
                </span>
              </div>
              <h2 id="next-medicine-heading" className="text-2xl sm:text-3xl font-extrabold text-ink mt-2">
                {nextDose.brandName}
              </h2>
              <p className="text-base text-ink-secondary font-medium mt-0.5">{nextDose.dosageText}</p>
            </div>
            <StatusChip status={nextDose.status} size="lg" />
          </div>

          <div className="bg-canvas p-4 rounded-card border border-hairline text-sm text-ink-secondary font-medium">
            <strong>When to take:</strong> {nextDose.instructions}
          </div>

          {nextDose.status !== 'TAKEN' ? (
            <HoldToConfirmButton onConfirmed={handleNextDoseConfirm} />
          ) : (
            <div className="p-4 bg-[#EAF5EF] border border-[#1E7A45]/30 rounded-card text-center space-y-1">
              <span className="text-2xl" aria-hidden="true">✅</span>
              <div className="font-bold text-[#1E7A45] text-lg">Recorded as Taken Today</div>
              <div className="text-xs text-emerald-900">
                Logged at {nextDose.recordedAt || 'Morning'} (Self-reported)
              </div>
            </div>
          )}
        </section>
      )}

      {/* Quick Navigation Cards (Large Touch Targets >= 56px) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          to="/today"
          className="card-premium rounded-card p-5 min-h-[90px] flex items-center justify-between hover:border-teal-400 transition-all active:scale-[0.98]"
        >
          <div>
            <div className="text-lg font-bold text-ink">Today's Schedule</div>
            <div className="text-xs text-ink-muted">All 4 doses around the clock</div>
          </div>
          <span className="text-2xl" aria-hidden="true">📋</span>
        </Link>

        <Link
          to="/appointments"
          className="card-premium rounded-card p-5 min-h-[90px] flex items-center justify-between hover:border-teal-400 transition-all active:scale-[0.98]"
        >
          <div>
            <div className="text-lg font-bold text-ink">Doctor Visits</div>
            <div className="text-xs text-teal-800 font-semibold">Tomorrow at 10:30 AM</div>
          </div>
          <span className="text-2xl" aria-hidden="true">🩺</span>
        </Link>

        <Link
          to="/circle"
          className="card-premium rounded-card p-5 min-h-[90px] flex items-center justify-between hover:border-teal-400 transition-all active:scale-[0.98]"
        >
          <div>
            <div className="text-lg font-bold text-ink">My Care Circle</div>
            <div className="text-xs text-ink-muted">Anita, Rahul & Sunita</div>
          </div>
          <span className="text-2xl" aria-hidden="true">🛡️</span>
        </Link>
      </div>

      {/* Modals */}
      <DoseSheet slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
      {showHelpModal && <ElderHelpModal onClose={() => setShowHelpModal(false)} />}
    </div>
  );
};
