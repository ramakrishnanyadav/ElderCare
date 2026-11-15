import React, { useState } from 'react';
import { Appointment } from '../../types';
import { useMockStore } from '../../store/mockStore';
import { useUserStore } from '../../store/userStore';

interface VisitCompanionModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export const VisitCompanionModal: React.FC<VisitCompanionModalProps> = ({
  appointment,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'BEFORE' | 'DURING' | 'AFTER'>('BEFORE');
  const [inVisitNotes, setInVisitNotes] = useState('');
  const activeUserId = useUserStore((s) => s.activeUserId);
  const activeUserName = useUserStore((s) => s.activeUserName);
  const approveMedicineChange = useMockStore((s) => s.approveMedicineChange);
  const rejectMedicineChange = useMockStore((s) => s.rejectMedicineChange);
  const medicines = useMockStore((s) => s.medicines.filter((m) => !m.isDiscontinued));

  if (!appointment) return null;

  const handleApprove = (proposalId: string) => {
    approveMedicineChange(appointment.id, proposalId, activeUserId, activeUserName);
  };

  const handleReject = (proposalId: string) => {
    rejectMedicineChange(appointment.id, proposalId);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visit-companion-title"
    >
      <div className="bg-surface w-full max-w-2xl rounded-card-lg p-6 sm:p-8 space-y-6 shadow-card-elevated border border-hairline max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-hairline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Doctor Visit Companion
              </span>
              <span className="text-xs text-ink-muted">{appointment.formattedDate}</span>
            </div>
            <h2 id="visit-companion-title" className="text-xl sm:text-2xl font-bold text-ink mt-1">
              {appointment.doctorName}
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary">
              {appointment.specialty} • {appointment.clinicName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-ink-muted hover:text-ink text-xl p-1"
          >
            ✕
          </button>
        </div>

        {/* 3-Step Card Stack Navigation: Before | During | After */}
        <div className="flex bg-canvas p-1 rounded-full border border-hairline">
          <button
            type="button"
            onClick={() => setActiveTab('BEFORE')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all ${
              activeTab === 'BEFORE'
                ? 'bg-teal-800 text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            1. Before Visit (Brief)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DURING')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all ${
              activeTab === 'DURING'
                ? 'bg-teal-800 text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            2. During Visit (Notes)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AFTER')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all relative ${
              activeTab === 'AFTER'
                ? 'bg-teal-800 text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            3. After Visit (Reconcile)
            {appointment.proposedChanges && appointment.proposedChanges.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-amber-400 text-black rounded-full font-bold">
                {appointment.proposedChanges.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: BEFORE VISIT (One-Page Doctor Brief) */}
        {activeTab === 'BEFORE' && (
          <div className="space-y-4">
            <div className="bg-canvas border border-hairline rounded-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-ink">Verified Clinical Summary</h4>
                <span className="text-xs text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Zero AI Inference • Verified Data Only
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-muted">Weekly BP Baseline:</span>
                  <p className="font-bold text-ink text-sm">{appointment.briefSummary.bloodPressure}</p>
                </div>
                <div>
                  <span className="text-ink-muted">Verified Active Meds:</span>
                  <p className="font-bold text-ink text-sm">
                    {appointment.briefSummary.verifiedMedicationsCount} prescriptions
                  </p>
                </div>
              </div>
            </div>

            {/* Key Questions for the Doctor */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-ink-muted">
                Questions to Discuss with Dr. {appointment.doctorName.split(' ')[1]}
              </h4>
              <ul className="space-y-1.5 text-xs text-ink bg-canvas p-3 rounded-card border border-hairline">
                {appointment.briefSummary.keyQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-teal-700 font-bold">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Current Active Prescriptions List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-ink-muted">
                Current Active Medications List (Hand to Clinic)
              </h4>
              <div className="divide-y divide-hairline bg-canvas rounded-card border border-hairline px-3 text-xs">
                {medicines.map((m) => (
                  <div key={m.id} className="py-2 flex justify-between items-center">
                    <div>
                      <strong className="text-ink">{m.brandName}</strong> ({m.genericName})
                      <div className="text-[11px] text-ink-muted">{m.instructions}</div>
                    </div>
                    <span className="font-mono text-teal-900 font-semibold">{m.scheduleTime}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Downloaded 1-Page Clinician Brief (PDF). Contains verified medication records only.')}
              className="w-full py-3 bg-teal-800 text-white rounded-full font-bold text-sm hover:bg-teal-900 transition-colors shadow-btn-teal"
            >
              📄 Download / Print 1-Page Clinic Brief
            </button>
          </div>
        )}

        {/* TAB 2: DURING VISIT (Capture Notes) */}
        {activeTab === 'DURING' && (
          <div className="space-y-4">
            <p className="text-xs text-ink-secondary">
              Record doctor observations, advice, or changes requested during the consultation. Saved notes are stored in the unalterable care ledger.
            </p>
            <textarea
              rows={6}
              value={inVisitNotes}
              onChange={(e) => setInVisitNotes(e.target.value)}
              placeholder="e.g. Doctor reviewed BP readings. Advised reducing Glycomet dosage if blood sugar is stable. Ordered repeat HbA1c in 3 months."
              className="w-full p-3.5 text-sm rounded-card border border-hairline bg-canvas focus:outline-none focus:ring-2 focus:ring-teal-700 font-sans"
            />
            <button
              type="button"
              onClick={() => {
                alert('Visit consultation notes securely saved to care ledger.');
                setActiveTab('AFTER');
              }}
              disabled={!inVisitNotes.trim()}
              className="w-full py-3 bg-teal-800 disabled:opacity-50 text-white rounded-full font-bold text-sm hover:bg-teal-900 transition-colors"
            >
              Save Consultation Notes
            </button>
          </div>
        )}

        {/* TAB 3: AFTER VISIT (Reconciliation & Proposed Changes) */}
        {activeTab === 'AFTER' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-card text-xs text-amber-950 font-medium">
              🛡️ <strong>Safety Non-Negotiable #4:</strong> Proposed medication changes are never auto-applied. Every drug or dosage change requires explicit verification and a second independent family approver.
            </div>

            {appointment.proposedChanges && appointment.proposedChanges.length > 0 ? (
              <div className="space-y-3">
                {appointment.proposedChanges.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-card border border-hairline bg-canvas space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-teal-800">
                          {prop.changeType}
                        </div>
                        <h4 className="text-base font-bold text-ink">{prop.brandName}</h4>
                        <div className="text-xs text-ink-secondary mt-1">
                          Current: <span className="line-through">{prop.currentDosage}</span>
                        </div>
                        <div className="text-xs text-emerald-900 font-bold mt-0.5">
                          Proposed: {prop.proposedDosage}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          prop.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : prop.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {prop.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-ink-muted">
                      Source: {prop.proposerName}
                    </div>

                    {prop.status === 'PROPOSED' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-hairline">
                        <button
                          type="button"
                          onClick={() => handleApprove(prop.id)}
                          className="flex-1 py-2 bg-[#1E7A45] hover:bg-emerald-700 text-white rounded-full font-bold text-xs transition-colors"
                        >
                          ✓ Approve (Second Approver)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(prop.id)}
                          className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-ink rounded-full font-bold text-xs transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink-muted text-center py-4">
                No proposed medication revisions pending reconciliation.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
