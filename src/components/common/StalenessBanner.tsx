import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { useMockStore } from '../../store/mockStore';

export const StalenessBanner: React.FC = () => {
  const offlineSimulated = useUserStore((s) => s.offlineSimulated);
  const setOfflineSimulated = useUserStore((s) => s.setOfflineSimulated);
  const offlineQueue = useMockStore((s) => s.offlineQueue);
  const [minutesAgo, setMinutesAgo] = useState(2);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesAgo((prev) => (prev < 60 ? prev + 1 : prev));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSimulateSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setMinutesAgo(0);
      setOfflineSimulated(false);
    }, 900);
  };

  if (!offlineSimulated && minutesAgo <= 1 && offlineQueue.length === 0) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Network and synchronization status"
      className="bg-[#DAEEEC] border-b border-teal-200 text-teal-950 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between transition-colors"
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            offlineSimulated ? 'bg-amber-600' : 'bg-teal-700 animate-pulse'
          }`}
        />
        <span>
          {offlineSimulated
            ? `Offline mode active • Local cache displayed • Last synced ${minutesAgo} min ago`
            : `Connected • Last synced ${minutesAgo === 0 ? 'just now' : `${minutesAgo} min ago`}`}
        </span>
        {offlineQueue.length > 0 && (
          <span className="bg-teal-800 text-white rounded-full px-2 py-0.5 text-xs font-semibold">
            {offlineQueue.length} action queued
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {syncing ? (
          <span className="flex items-center gap-1.5 text-teal-800">
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
            </svg>
            Syncing...
          </span>
        ) : (
          <button
            onClick={handleSimulateSync}
            className="hover:underline text-teal-900 font-semibold focus:outline-none"
          >
            {offlineSimulated ? 'Reconnect & Sync' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
};
