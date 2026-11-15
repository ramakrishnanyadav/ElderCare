import React, { useState } from 'react';
import { CareCircleMember } from '../../types';
import { useMockStore } from '../../store/mockStore';

export const CareCirclePresence: React.FC = () => {
  const members = useMockStore((s) => s.careCircle);
  const [selectedMember, setSelectedMember] = useState<CareCircleMember | null>(null);

  return (
    <div className="card-premium rounded-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-ink text-base">Care Circle Presence & On-Call</h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Active responders. The on-call primary responder carries a calm breathing ring.
          </p>
        </div>
      </div>

      {/* Avatar Cluster */}
      <div className="flex flex-wrap items-center gap-4 pt-1">
        {members.map((member) => {
          const isSelected = selectedMember?.id === member.id;

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setSelectedMember(isSelected ? null : member)}
              className="group relative flex items-center gap-3 p-2.5 rounded-card bg-canvas hover:bg-slate-100 border border-hairline transition-all text-left focus:outline-none focus:ring-2 focus:ring-teal-700"
              aria-label={`${member.name}, ${member.relation}. On-Call: ${member.isOnCall ? 'Yes' : 'No'}`}
            >
              <div className="relative">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm tracking-tight text-white transition-transform ${
                    member.role === 'ELDER'
                      ? 'bg-amber-700'
                      : member.role === 'FAMILY_PRIMARY'
                      ? 'bg-teal-800'
                      : member.role === 'FAMILY_SECONDARY'
                      ? 'bg-teal-700'
                      : 'bg-emerald-700'
                  } ${member.isOnCall ? 'breathing-ring ring-4 ring-teal-600/30' : ''}`}
                >
                  {member.initials}
                </div>

                {/* Status indicator dot */}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    member.ackStatus === 'ACKNOWLEDGED'
                      ? 'bg-[#1E7A45]'
                      : member.ackStatus === 'PENDING_ACK'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-teal-700'
                  }`}
                  title={`Status: ${member.ackStatus}`}
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm text-ink">{member.name}</span>
                  {member.isOnCall && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-200 px-1.5 py-0.2 rounded-full">
                      On-Call
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-muted">{member.relation}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Member Detail Card */}
      {selectedMember && (
        <div className="bg-teal-50 border border-teal-200 rounded-card p-4 space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
              Responder Detail
            </span>
            <button
              onClick={() => setSelectedMember(null)}
              className="text-xs font-semibold text-teal-800 hover:text-teal-950"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-ink-muted">Name & Role:</span>
              <p className="font-semibold text-ink">
                {selectedMember.name} ({selectedMember.role})
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Acknowledgement State:</span>
              <p className="font-semibold text-ink">
                {selectedMember.ackStatus === 'ACKNOWLEDGED'
                  ? '✅ Active & Confirmed Ready'
                  : '⏳ Awaiting Shift Handover'}
              </p>
            </div>
            <div>
              <span className="text-ink-muted">Emergency Phone:</span>
              <p className="font-semibold text-ink tabular-nums">{selectedMember.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
