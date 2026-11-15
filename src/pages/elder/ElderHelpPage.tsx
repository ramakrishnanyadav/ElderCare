import React from 'react';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';

export const ElderHelpPage: React.FC = () => {
  const language = useUserStore((s) => s.language);
  const t = translations[language].elder;

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-12 pt-4">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-teal-50 rounded-full flex items-center justify-center text-4xl border border-teal-200">
          📞
        </div>
        <h1 className="text-3xl font-extrabold text-ink">{t.callFamily}</h1>
        <p className="text-sm text-ink-muted">
          Tap any button below to connect immediately via phone call
        </p>
      </div>

      <div className="space-y-4">
        {/* Anita - Daughter */}
        <a
          href="tel:+919845012345"
          className="flex items-center justify-between p-6 bg-teal-50 hover:bg-teal-100 rounded-card-lg border-2 border-teal-700 transition-transform active:scale-[0.98] shadow-sm text-left block"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
              Primary On-Call
            </span>
            <div className="text-2xl font-bold text-ink mt-1">{t.callPrimary}</div>
            <div className="text-sm text-ink-muted font-mono mt-0.5">+91 98450 12345</div>
          </div>
          <span className="text-3xl" aria-hidden="true">📞</span>
        </a>

        {/* Sunita - Caregiver */}
        <a
          href="tel:+919871234567"
          className="flex items-center justify-between p-6 bg-surface hover:bg-slate-50 rounded-card-lg border border-hairline transition-transform active:scale-[0.98] shadow-sm text-left block"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted bg-canvas px-2 py-0.5 rounded-full">
              Daytime Caregiver
            </span>
            <div className="text-2xl font-bold text-ink mt-1">{t.callCaregiver}</div>
            <div className="text-sm text-ink-muted font-mono mt-0.5">+91 98712 34567</div>
          </div>
          <span className="text-3xl" aria-hidden="true">📞</span>
        </a>

        {/* Rahul - Son */}
        <a
          href="tel:+14165550192"
          className="flex items-center justify-between p-6 bg-surface hover:bg-slate-50 rounded-card-lg border border-hairline transition-transform active:scale-[0.98] shadow-sm text-left block"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted bg-canvas px-2 py-0.5 rounded-full">
              Son (Canada)
            </span>
            <div className="text-2xl font-bold text-ink mt-1">Call Rahul (Son)</div>
            <div className="text-sm text-ink-muted font-mono mt-0.5">+1 416 555 0192</div>
          </div>
          <span className="text-3xl" aria-hidden="true">📞</span>
        </a>
      </div>

      {/* Emergency Medical Call Box */}
      <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-card-lg space-y-3">
        <div className="flex items-center gap-2 text-rose-900 font-bold text-lg">
          <span>🚨</span>
          <span>Emergency Assistance</span>
        </div>
        <p className="text-xs sm:text-sm text-rose-800 leading-relaxed font-medium">
          {t.emergencyNote}
        </p>
        <a
          href="tel:112"
          className="block text-center py-4 bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-lg rounded-full shadow-md transition-colors"
        >
          Call National Emergency 112
        </a>
      </div>
    </div>
  );
};
