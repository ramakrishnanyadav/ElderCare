import React from 'react';
import { EvidenceMixBar } from '../../components/common/EvidenceMixBar';

export const FamilyWeeklyReportPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Weekly Care Continuity Report
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          Past 7 days adherence evidence audit. In accordance with safety rules, we report verified evidence grades rather than an unverified single percentage score.
        </p>
      </div>

      {/* Signature Segmented Evidence Mix Bar */}
      <EvidenceMixBar />

      {/* Weekly Breakdown Table */}
      <div className="card-premium rounded-card p-5 space-y-4">
        <h3 className="font-semibold text-ink text-base">Daily Evidence Ledger Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-hairline text-ink-muted uppercase font-bold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Scheduled</th>
                <th className="py-2.5 px-3">Self-Reported</th>
                <th className="py-2.5 px-3">Witnessed</th>
                <th className="py-2.5 px-3">Clinician / Other</th>
                <th className="py-2.5 px-3">Status Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {[
                { date: 'Today (Sun, 15 Nov)', total: 4, self: 3, wit: 1, clin: 0, status: 'On Track' },
                { date: 'Yesterday (Sat, 14 Nov)', total: 4, self: 2, wit: 2, clin: 0, status: 'Complete' },
                { date: 'Fri, 13 Nov', total: 4, self: 3, wit: 1, clin: 0, status: 'Complete' },
                { date: 'Thu, 12 Nov', total: 4, self: 2, wit: 1, clin: 1, status: 'Dr. Brief Reconciled' },
                { date: 'Wed, 11 Nov', total: 4, self: 3, wit: 1, clin: 0, status: 'Complete' },
                { date: 'Tue, 10 Nov', total: 4, self: 2, wit: 2, clin: 0, status: 'Complete' },
                { date: 'Mon, 09 Nov', total: 4, self: 3, wit: 0, clin: 1, status: 'Complete' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-ink">{row.date}</td>
                  <td className="py-2.5 px-3 font-mono">{row.total}</td>
                  <td className="py-2.5 px-3 font-mono text-teal-800 font-bold">{row.self}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-800 font-bold">{row.wit}</td>
                  <td className="py-2.5 px-3 font-mono text-blue-800 font-bold">{row.clin}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Burn Rate & Refill Projections */}
      <div className="card-premium rounded-card p-5 space-y-3">
        <h3 className="font-semibold text-ink text-base">Prescription Stock Projections</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-canvas rounded-card border border-hairline space-y-1">
            <span className="text-ink-muted">Glycomet-GP 1</span>
            <div className="text-base font-bold text-ink">18 doses remaining</div>
            <div className="text-[11px] text-teal-800">Sufficient for 18 days</div>
          </div>
          <div className="p-3 bg-canvas rounded-card border border-hairline space-y-1">
            <span className="text-ink-muted">Telma 40</span>
            <div className="text-base font-bold text-ink">22 doses remaining</div>
            <div className="text-[11px] text-teal-800">Sufficient for 22 days</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-card border border-amber-300 space-y-1">
            <span className="text-amber-900 font-bold">Ecospirin 75 (ALERT)</span>
            <div className="text-base font-bold text-amber-950">4 doses remaining</div>
            <div className="text-[11px] text-amber-800 font-semibold">Refill Obligation Active</div>
          </div>
          <div className="p-3 bg-canvas rounded-card border border-hairline space-y-1">
            <span className="text-ink-muted">Rosuvas 10</span>
            <div className="text-base font-bold text-ink">30 doses remaining</div>
            <div className="text-[11px] text-teal-800">Sufficient for 30 days</div>
          </div>
        </div>
      </div>
    </div>
  );
};
