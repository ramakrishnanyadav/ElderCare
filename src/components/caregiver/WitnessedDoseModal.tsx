import React, { useState } from 'react';
import { DoseSlot } from '../../types';
import { useMockStore } from '../../store/mockStore';
import { useUserStore } from '../../store/userStore';

interface WitnessedDoseModalProps {
  slot: DoseSlot | null;
  onClose: () => void;
}

export const WitnessedDoseModal: React.FC<WitnessedDoseModalProps> = ({ slot, onClose }) => {
  const [witnessNote, setWitnessNote] = useState('');
  const [confirmedVisual, setConfirmedVisual] = useState(false);
  const markDoseTaken = useMockStore((s) => s.markDoseTaken);
  const activeUserName = useUserStore((s) => s.activeUserName);

  if (!slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedVisual) {
      alert('You must confirm direct visual observation.');
      return;
    }

    await markDoseTaken(slot.id, 'CAREGIVER_WITNESSED', activeUserName);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="witness-modal-title"
    >
      <div className="bg-surface w-full max-w-md rounded-card-lg p-6 sm:p-8 space-y-6 shadow-card-elevated border border-hairline">
        <div className="flex items-start justify-between border-b border-hairline pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Caregiver Observation
            </span>
            <h2 id="witness-modal-title" className="text-xl font-bold text-ink mt-1">
              {slot.brandName}
            </h2>
            <p className="text-xs text-ink-muted">{slot.dosageText}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-ink-muted hover:text-ink text-xl p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-card text-xs text-emerald-950 font-medium leading-relaxed">
            👁️ <strong>Evidence Grade Non-Negotiable #3:</strong> This intake will be permanently graded as <strong>Caregiver Witnessed</strong> in the append-only ledger, attributing direct observation to you ({activeUserName}).
          </div>

          <label className="flex items-start gap-3 p-3 bg-canvas rounded-card border border-hairline cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedVisual}
              onChange={(e) => setConfirmedVisual(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-gray-300 focus:ring-emerald-700"
              required
            />
            <span className="text-xs text-ink font-medium leading-snug">
              I confirm that I was physically present and directly observed Dhyanchand ji taking this dose with water.
            </span>
          </label>

          <div className="space-y-1">
            <label htmlFor="witness-observation-note" className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Observation Notes (Optional)
            </label>
            <textarea
              id="witness-observation-note"
              rows={2}
              value={witnessNote}
              onChange={(e) => setWitnessNote(e.target.value)}
              placeholder="e.g. Taken after breakfast, Elder appeared energetic and calm."
              className="w-full p-3 text-xs rounded-card border border-hairline bg-canvas focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-ink-secondary bg-canvas hover:bg-slate-200 rounded-full border border-hairline transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmedVisual}
              className="flex-1 py-3 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-full transition-colors shadow-sm"
            >
              Record Witnessed Dose
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
