import React from 'react';
import { CareCirclePresence } from '../../components/family/CareCirclePresence';
import { AccessLedgerView } from '../../components/family/AccessLedgerView';

export const FamilyCirclePage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Care Circle & Consent Permissions
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          Caregiver and family assignments, on-call shift rotation, and privacy audits.
        </p>
      </div>

      {/* Circle Presence Component */}
      <CareCirclePresence />

      {/* Access Ledger & Sharing Pause Component */}
      <AccessLedgerView />
    </div>
  );
};
