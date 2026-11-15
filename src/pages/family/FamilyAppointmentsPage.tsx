import React, { useState } from 'react';
import { useMockStore } from '../../store/mockStore';
import { VisitCompanionModal } from '../../components/family/VisitCompanionModal';
import { Appointment } from '../../types';

export const FamilyAppointmentsPage: React.FC = () => {
  const appointments = useMockStore((s) => s.appointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Clinical Appointments & Visit Companion
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          Doctor visit brief generator, consultation note capture, and post-visit medication reconciliation.
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="card-premium rounded-card p-6 space-y-5 border border-hairline"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-teal-900 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {apt.formattedDate}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-ink mt-2">{apt.doctorName}</h3>
                <p className="text-sm font-semibold text-teal-800">{apt.specialty}</p>
                <p className="text-xs text-ink-muted mt-0.5">{apt.clinicName}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAppointment(apt)}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-full font-bold text-xs shadow-btn-teal transition-all active:scale-[0.98] self-start sm:self-auto"
              >
                Launch Visit Companion →
              </button>
            </div>

            {/* Preparation Tasks Summary */}
            <div className="bg-canvas p-4 rounded-card border border-hairline space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center justify-between">
                <span>Required Visit Preparation</span>
                <span className="text-[11px] text-teal-900 font-semibold">
                  {apt.prepTasks.filter((t) => t.completed).length} of {apt.prepTasks.length} done
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {apt.prepTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-ink">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        t.completed ? 'bg-emerald-600 text-white' : 'border border-slate-400 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className={t.completed ? 'line-through text-ink-muted' : 'font-medium'}>
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposed changes banner if any */}
            {apt.proposedChanges && apt.proposedChanges.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-card flex items-center justify-between gap-3 text-xs text-amber-950 font-medium">
                <div>
                  <strong>Post-visit prescription changes proposed:</strong> {apt.proposedChanges.length} revision(s) require second family sign-off.
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAppointment(apt)}
                  className="font-bold underline text-amber-900 hover:text-amber-950"
                >
                  Review in Companion
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <VisitCompanionModal
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
};
