import React from 'react';
import { DoseSlot } from '../../types';
import { useUserStore } from '../../store/userStore';
import { useMockStore } from '../../store/mockStore';
import { translations } from '../../i18n/translations';
import { StatusChip } from '../common/StatusChip';
import { HoldToConfirmButton } from './HoldToConfirmButton';

interface DoseSheetProps {
  slot: DoseSlot | null;
  onClose: () => void;
}

export const DoseSheet: React.FC<DoseSheetProps> = ({ slot, onClose }) => {
  const language = useUserStore((s) => s.language);
  const tElder = translations[language].elder;
  const tCommon = translations[language].common;
  const markDoseTaken = useMockStore((s) => s.markDoseTaken);
  const markDoseSkipped = useMockStore((s) => s.markDoseSkipped);

  if (!slot) return null;

  const handleConfirm = async () => {
    await markDoseTaken(slot.id, 'PATIENT_REPORTED');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleSkip = () => {
    markDoseSkipped(slot.id, 'Elder reported feeling unwell/nauseous');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dose-sheet-title"
    >
      <div className="bg-surface w-full max-w-lg rounded-t-[28px] sm:rounded-card-lg p-6 sm:p-8 space-y-6 shadow-card-elevated border border-hairline animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              Scheduled for {slot.dueTime}
            </span>
            <h2 id="dose-sheet-title" className="text-2xl sm:text-3xl font-bold text-ink">
              {slot.brandName}
            </h2>
            <p className="text-base text-ink-secondary font-medium">{slot.dosageText}</p>
          </div>
          <StatusChip status={slot.status} size="lg" />
        </div>

        {/* Instructions */}
        <div className="bg-canvas rounded-card p-4 border border-hairline space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Instructions
          </div>
          <div className="text-base text-ink font-medium">{slot.instructions}</div>
        </div>

        {/* Safety Non-Negotiable Rule #4 Banner */}
        <div className="bg-[#FFF5E6] border border-amber-200 rounded-card p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
          <span className="text-base" aria-hidden="true">⚠️</span>
          <p className="leading-relaxed font-medium">{tElder.askDoctor}</p>
        </div>

        {/* Action Button: Hold To Confirm if DUE or NOT_YET */}
        {slot.status !== 'TAKEN' ? (
          <div className="space-y-4 pt-2">
            <HoldToConfirmButton onConfirmed={handleConfirm} />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 min-h-[52px] px-4 py-2.5 text-sm font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-full border border-amber-300 transition-colors"
              >
                Skip this dose
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[52px] px-4 py-2.5 text-sm font-semibold text-ink-secondary bg-canvas hover:bg-slate-200 rounded-full border border-hairline transition-colors"
              >
                {tCommon.close}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-[#EAF5EF] border border-[#1E7A45]/30 rounded-card text-center space-y-1">
              <span className="text-2xl" aria-hidden="true">✅</span>
              <div className="font-bold text-[#1E7A45] text-lg">Already Confirmed Taken</div>
              <div className="text-xs text-emerald-900">
                Recorded at {slot.recordedAt || 'Earlier today'} (Self-reported)
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[56px] text-base font-semibold text-ink-secondary bg-canvas hover:bg-slate-200 rounded-full border border-hairline transition-colors"
            >
              {tCommon.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
