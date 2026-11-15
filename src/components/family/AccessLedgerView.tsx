import React from 'react';
import { useMockStore } from '../../store/mockStore';

export const AccessLedgerView: React.FC = () => {
  const logs = useMockStore((s) => s.accessLogs);
  const sharingPaused = useMockStore((s) => s.sharingPaused);
  const toggleSharingPause = useMockStore((s) => s.toggleSharingPause);

  return (
    <div className="card-premium rounded-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink text-base">Plain-Language Access Ledger</h3>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-ink-secondary px-2 py-0.5 rounded-full border border-hairline">
              DPDP Compliant
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Every view, update and export is recorded here. The Elder can pause sharing at any time.
          </p>
        </div>

        {/* One-Tap Pause Sharing Control */}
        <button
          type="button"
          onClick={toggleSharingPause}
          className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all self-start sm:self-auto shadow-sm flex items-center gap-1.5 ${
            sharingPaused
              ? 'bg-[#1E7A45] hover:bg-emerald-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          {sharingPaused ? '▶️ Resume Care Sharing' : '⏸️ One-Tap Pause Sharing'}
        </button>
      </div>

      {/* Sharing Paused Alert Banner */}
      {sharingPaused && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-card flex items-start gap-2.5 text-xs text-amber-950 font-medium">
          <span className="text-base" aria-hidden="true">🛡️</span>
          <div>
            <strong>Sharing is currently paused by the Elder.</strong> Non-elder accounts cannot see real-time updates or view confidential routine records until sharing is explicitly resumed.
          </div>
        </div>
      )}

      {/* Access Event Timeline */}
      <div className="divide-y divide-hairline">
        {logs.slice(0, 6).map((log) => (
          <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <div className="font-medium text-ink flex items-center gap-1.5">
                <span className="font-bold text-teal-900">{log.actorName}</span>
                <span className="text-ink-muted">({log.actorRole})</span>
              </div>
              <p className="text-ink-secondary text-xs">{log.actionSummary}</p>
            </div>
            <span className="text-ink-muted shrink-0 tabular-nums">{log.timestampText}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
