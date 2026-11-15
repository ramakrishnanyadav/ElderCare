import React, { useState } from 'react';
import { useMockStore } from '../../store/mockStore';
import { useUserStore } from '../../store/userStore';

export const CaregiverHandoverPage: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [bpValue, setBpValue] = useState('130/82');
  const [mealStatus, setMealStatus] = useState('Breakfast finished completely');
  const addHandoverNote = useMockStore((s) => s.addHandoverNote);
  const activeUserName = useUserStore((s) => s.activeUserName);
  const accessLogs = useMockStore((s) => s.accessLogs.filter((l) => l.actionSummary.includes('Handover')));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    const summary = `Shift Handover: BP ${bpValue}. Diet: ${mealStatus}. Notes: ${notes}`;
    addHandoverNote(summary, activeUserName);
    setNotes('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Caregiver Shift Handover
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          Record observations before shift conclusion. Handover notes are synced to the family care ledger.
        </p>
      </div>

      <div className="card-premium rounded-card p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="bp-record-input" className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Morning Blood Pressure
              </label>
              <input
                id="bp-record-input"
                type="text"
                value={bpValue}
                onChange={(e) => setBpValue(e.target.value)}
                placeholder="e.g. 130/82 mmHg"
                className="w-full p-3 rounded-card border border-hairline bg-canvas text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="meal-intake-select" className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Meal & Fluid Intake
              </label>
              <select
                id="meal-intake-select"
                value={mealStatus}
                onChange={(e) => setMealStatus(e.target.value)}
                className="w-full p-3 rounded-card border border-hairline bg-canvas text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="Breakfast finished completely">Breakfast finished completely</option>
                <option value="Light intake, finished half portion">Light intake, finished half portion</option>
                <option value="Skipped meal, offered warm milk">Skipped meal, offered warm milk</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="shift-observation-notes" className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">
              General Demeanor, Vitals & Observations
            </label>
            <textarea
              id="shift-observation-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dhyanchand ji went for a 15-minute garden walk in the morning. Took warm ginger tea. In cheerful spirits, no complaints of dizziness."
              className="w-full p-3.5 text-sm rounded-card border border-hairline bg-canvas focus:outline-none focus:ring-2 focus:ring-teal-700"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-full font-bold text-sm shadow-btn-teal transition-all active:scale-[0.98]"
          >
            Submit Shift Handover Note
          </button>
        </form>
      </div>

      {/* Handover Log Archive */}
      {accessLogs.length > 0 && (
        <div className="card-premium rounded-card p-5 space-y-3">
          <h3 className="font-semibold text-ink text-base">Recent Shift Handovers</h3>
          <div className="divide-y divide-hairline">
            {accessLogs.map((log) => (
              <div key={log.id} className="py-2.5 text-xs space-y-0.5">
                <div className="flex justify-between font-bold text-ink">
                  <span>{log.actorName}</span>
                  <span className="text-ink-muted font-mono">{log.timestampText}</span>
                </div>
                <p className="text-ink-secondary">{log.actionSummary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
