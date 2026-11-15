import React, { useState } from 'react';
import { Medicine } from '../../types';
import { useMockStore } from '../../store/mockStore';
import { useUserStore } from '../../store/userStore';

interface ProposeApproveModalProps {
  medicine: Medicine | null;
  onClose: () => void;
}

export const ProposeApproveModal: React.FC<ProposeApproveModalProps> = ({ medicine, onClose }) => {
  const [changeType, setChangeType] = useState<'TIMING' | 'DOSE'>('TIMING');
  const [newTime, setNewTime] = useState(medicine?.scheduleTime || '08:00');
  const [newDosage, setNewDosage] = useState(medicine?.instructions || '');
  const [doctorNoteRef, setDoctorNoteRef] = useState('');

  const updateMedicineTiming = useMockStore((s) => s.updateMedicineTiming);
  const proposeMedicineChange = useMockStore((s) => s.proposeMedicineChange);
  const activeUserId = useUserStore((s) => s.activeUserId);
  const activeUserName = useUserStore((s) => s.activeUserName);

  if (!medicine) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (changeType === 'TIMING') {
      // Timing edit applies immediately with 24h notification & undo
      updateMedicineTiming(medicine.id, newTime);
      onClose();
    } else {
      // Drug / dose change enters PROPOSAL state
      if (!doctorNoteRef.trim()) {
        alert('Safety requirement: Modifying drug or dose requires an attached doctor prescription note reference.');
        return;
      }

      proposeMedicineChange('apt-1', {
        brandName: medicine.brandName,
        changeType: 'DOSE_CHANGE',
        currentDosage: `${medicine.dosageQuantity} ${medicine.dosageUnit}`,
        proposedDosage: newDosage,
        proposerName: activeUserName,
        proposerId: activeUserId,
      });

      alert('Proposal submitted. In accordance with safety rules, a second family member or clinician must approve before this change takes effect.');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="propose-modal-title"
    >
      <div className="bg-surface w-full max-w-lg rounded-card-lg p-6 sm:p-8 space-y-6 shadow-card-elevated border border-hairline max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-hairline pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Schedule Governance
            </span>
            <h2 id="propose-modal-title" className="text-xl sm:text-2xl font-bold text-ink mt-1">
              {medicine.brandName}
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">{medicine.genericName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-ink-muted hover:text-ink text-xl p-1"
          >
            ✕
          </button>
        </div>

        {/* Change Type Switcher: Routine Timing vs Clinical Dose */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setChangeType('TIMING')}
            className={`p-3 rounded-card text-left border transition-all ${
              changeType === 'TIMING'
                ? 'bg-teal-50 border-teal-600 text-teal-950 font-semibold'
                : 'bg-canvas border-hairline text-ink-secondary'
            }`}
          >
            <div className="text-xs uppercase font-bold text-teal-800">Routine Edit</div>
            <div className="text-sm font-bold mt-1">Change Timing</div>
            <div className="text-[11px] text-ink-muted mt-0.5">Applies with 24h undo</div>
          </button>

          <button
            type="button"
            onClick={() => setChangeType('DOSE')}
            className={`p-3 rounded-card text-left border transition-all ${
              changeType === 'DOSE'
                ? 'bg-amber-50 border-amber-600 text-amber-950 font-semibold'
                : 'bg-canvas border-hairline text-ink-secondary'
            }`}
          >
            <div className="text-xs uppercase font-bold text-amber-800">Clinical Edit</div>
            <div className="text-sm font-bold mt-1">Change Dose/Drug</div>
            <div className="text-[11px] text-ink-muted mt-0.5">Requires 2nd Approver</div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {changeType === 'TIMING' ? (
            <div className="space-y-2">
              <label htmlFor="routine-time-input" className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Daily Intake Time
              </label>
              <input
                id="routine-time-input"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full p-3 rounded-card border border-hairline bg-canvas text-base font-bold text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
                required
              />
              <p className="text-xs text-ink-muted">
                Dhyanchand ji will be notified on their device with an in-app toast and 24-hour reversal window.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="clinical-dosage-input" className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Proposed Instructions & Dosage
                </label>
                <textarea
                  id="clinical-dosage-input"
                  rows={3}
                  value={newDosage}
                  onChange={(e) => setNewDosage(e.target.value)}
                  placeholder="e.g. 0.5 tablet (Half tablet) before breakfast"
                  className="w-full p-3 text-sm rounded-card border border-hairline bg-canvas focus:outline-none focus:ring-2 focus:ring-teal-700"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rx-doc-input" className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Verified Prescription Reference / File Upload
                </label>
                <input
                  id="rx-doc-input"
                  type="text"
                  value={doctorNoteRef}
                  onChange={(e) => setDoctorNoteRef(e.target.value)}
                  placeholder="e.g. Max Hospital OPD Rx #MAX-2026-98124"
                  className="w-full p-3 text-sm rounded-card border border-hairline bg-canvas focus:outline-none focus:ring-2 focus:ring-teal-700"
                  required
                />
                <p className="text-[11px] text-amber-900 font-medium">
                  Safety rule: Drug or dose changes cannot be saved without an attached verified clinical document.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-hairline">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-ink-secondary bg-canvas hover:bg-slate-200 rounded-full border border-hairline transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-sm font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-full transition-colors shadow-btn-teal"
            >
              {changeType === 'TIMING' ? 'Apply Timing Change' : 'Submit for Second Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
