import React, { useEffect, useState } from 'react';
import { useMockStore } from '../../store/mockStore';

export const Toast: React.FC = () => {
  const activeToast = useMockStore((s) => s.activeToast);
  const clearToast = useMockStore((s) => s.clearToast);
  const [remainingPercent, setRemainingPercent] = useState(100);

  useEffect(() => {
    if (!activeToast) {
      setRemainingPercent(100);
      return;
    }

    const totalDuration = activeToast.expiresAt - Date.now();
    if (totalDuration <= 0) {
      clearToast();
      return;
    }

    const interval = setInterval(() => {
      const left = activeToast.expiresAt - Date.now();
      if (left <= 0) {
        clearInterval(interval);
        clearToast();
      } else {
        setRemainingPercent((left / totalDuration) * 100);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [activeToast, clearToast]);

  if (!activeToast) return null;

  return (
    <aside
      aria-label="Notification"
      className="fixed bottom-6 right-6 z-50 max-w-md w-[calc(100vw-3rem)] bg-[#0B554F] text-white rounded-card p-4 shadow-xl border border-teal-600 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="flex items-center gap-3">
        {/* Draining circular countdown ring */}
        <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-teal-900"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-teal-300 transition-all duration-200 stroke-current"
              strokeDasharray={`${remainingPercent}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-[10px] font-bold text-teal-100">10m</span>
        </div>

        <div>
          <h4 className="font-semibold text-sm leading-snug">{activeToast.title}</h4>
          {activeToast.subtitle && (
            <p className="text-xs text-teal-200 mt-0.5">{activeToast.subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {activeToast.undoAction && (
          <button
            onClick={() => {
              activeToast.undoAction?.();
              clearToast();
            }}
            className="px-3 py-1.5 bg-white text-teal-900 hover:bg-teal-50 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Undo
          </button>
        )}
        <button
          onClick={clearToast}
          aria-label="Dismiss toast"
          className="text-teal-300 hover:text-white p-1"
        >
          ✕
        </button>
      </div>
    </aside>
  );
};
