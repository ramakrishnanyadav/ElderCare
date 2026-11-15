import React from 'react';
import { useMockStore } from '../../store/mockStore';
import { EscalationLadder } from '../../components/family/EscalationLadder';

export const FamilyObligationsPage: React.FC = () => {
  const obligations = useMockStore((s) => s.obligations);
  const acknowledgeObligation = useMockStore((s) => s.acknowledgeObligation);
  const fulfillObligation = useMockStore((s) => s.fulfillObligation);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Accountable Care Obligations
        </h1>
        <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
          Every critical care event has an accountable owner, strict deadline, and audited closure condition.
        </p>
      </div>

      {/* Obligations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {obligations.map((ob) => {
          const isPending = ob.status === 'PENDING';
          const isAck = ob.status === 'ACKNOWLEDGED';
          const isFulfilled = ob.status === 'FULFILLED';

          return (
            <div
              key={ob.id}
              className="card-premium rounded-card p-5 space-y-4 border border-hairline flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {ob.category}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      isFulfilled
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : isAck
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {ob.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-ink">{ob.title}</h3>

                <div className="text-xs text-ink-secondary space-y-1">
                  <div>
                    Owner: <strong className="text-ink">{ob.ownerName}</strong> ({ob.ownerRole})
                  </div>
                  <div className="text-rose-800 font-semibold font-mono">
                    Deadline: {ob.deadlineText}
                  </div>
                </div>

                <div className="bg-canvas p-3 rounded-card text-xs text-ink-secondary border border-hairline space-y-1">
                  <span className="font-bold text-ink uppercase tracking-wider text-[10px]">
                    Closure Condition:
                  </span>
                  <p className="leading-snug">{ob.closureCondition}</p>
                </div>
              </div>

              {!isFulfilled && (
                <div className="flex items-center gap-2 pt-2 border-t border-hairline">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => acknowledgeObligation(ob.id)}
                      className="flex-1 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-full font-bold text-xs transition-colors shadow-sm"
                    >
                      Acknowledge Responsibility
                    </button>
                  )}
                  {isAck && (
                    <button
                      type="button"
                      onClick={() => fulfillObligation(ob.id, 'Verified via pharmacy upload / check-in receipt')}
                      className="flex-1 py-2.5 bg-[#1E7A45] hover:bg-emerald-700 text-white rounded-full font-bold text-xs transition-colors shadow-sm"
                    >
                      ✓ Mark Fulfilled with Proof
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Escalation Ladder component */}
      <EscalationLadder />
    </div>
  );
};
