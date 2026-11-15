import React from 'react';
import { useMockStore } from '../../store/mockStore';
import { CareCirclePresence } from '../../components/family/CareCirclePresence';
import { AccessLedgerView } from '../../components/family/AccessLedgerView';

export const ElderCirclePage: React.FC = () => {
  const sharingPaused = useMockStore((s) => s.sharingPaused);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          My Care Circle & Privacy Ledger
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          You are at the center of every decision. Monitor who views your data and pause sharing anytime.
        </p>
      </div>

      {sharingPaused && (
        <div className="p-4 bg-amber-100 border border-amber-300 rounded-card-lg text-amber-950 space-y-1">
          <div className="font-bold text-base flex items-center gap-2">
            <span>🛡️</span>
            <span>Care Sharing is Paused</span>
          </div>
          <p className="text-xs">
            Family and caregiver accounts cannot view your health status while sharing is paused.
          </p>
        </div>
      )}

      {/* Circle Presence */}
      <CareCirclePresence />

      {/* Access Ledger with One-Tap Pause */}
      <AccessLedgerView />
    </div>
  );
};
