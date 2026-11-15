import React, { useState } from 'react';
import { useMockStore } from '../../store/mockStore';
import { VisitCompanionModal } from '../../components/family/VisitCompanionModal';
import { Appointment } from '../../types';

export const ElderAppointmentsPage: React.FC = () => {
  const appointments = useMockStore((s) => s.appointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Doctor Appointments
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Upcoming consultations and preparation instructions.
        </p>
      </div>

      <div className="space-y-4">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className="card-premium rounded-card-lg p-6 space-y-5 border border-hairline"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {apt.formattedDate}
                </span>
                <h3 className="text-2xl font-bold text-ink mt-2">{apt.doctorName}</h3>
                <p className="text-sm font-semibold text-teal-900">{apt.specialty}</p>
                <p className="text-xs text-ink-muted mt-0.5">{apt.clinicName}</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-teal-100 text-teal-900 rounded-full border border-teal-200 self-start">
                Confirmed OPD Visit
              </span>
            </div>

            {/* Preparation Tasks */}
            <div className="bg-canvas p-4 rounded-card border border-hairline space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Preparation Tasks Before Leaving Home
              </div>
              <div className="space-y-1.5">
                {apt.prepTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2.5 text-xs sm:text-sm text-ink">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        task.completed ? 'bg-emerald-600 text-white' : 'border border-slate-400 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className={task.completed ? 'line-through text-ink-muted' : 'font-medium'}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedAppointment(apt)}
              className="w-full min-h-[56px] text-base font-bold rounded-full bg-teal-800 hover:bg-teal-900 text-white shadow-btn-teal transition-all active:scale-[0.98]"
            >
              Open Doctor Visit Companion (1-Page Brief)
            </button>
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
