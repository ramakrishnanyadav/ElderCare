import React from 'react';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';

interface ElderHelpModalProps {
  onClose: () => void;
}

export const ElderHelpModal: React.FC<ElderHelpModalProps> = ({ onClose }) => {
  const language = useUserStore((s) => s.language);
  const t = translations[language].elder;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="bg-surface w-full max-w-md rounded-card-lg p-6 sm:p-8 space-y-6 shadow-card-elevated border border-hairline">
        <div className="text-center space-y-1">
          <div className="w-14 h-14 mx-auto bg-teal-50 rounded-full flex items-center justify-center text-3xl border border-teal-200">
            📞
          </div>
          <h2 id="help-modal-title" className="text-2xl font-bold text-ink">
            {t.callFamily}
          </h2>
          <p className="text-xs text-ink-muted">Tap to call your registered responders directly</p>
        </div>

        <div className="space-y-3">
          {/* Anita (Daughter - Primary On-Call) */}
          <a
            href="tel:+919845012345"
            className="flex items-center justify-between p-4 bg-teal-50 hover:bg-teal-100 rounded-card border-2 border-teal-600 transition-transform active:scale-[0.98] text-left"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Primary On-Call
              </div>
              <div className="text-lg font-bold text-ink">{t.callPrimary}</div>
              <div className="text-xs text-ink-muted font-mono">+91 98450 12345</div>
            </div>
            <span className="text-2xl" aria-hidden="true">📞</span>
          </a>

          {/* Sunita (Caregiver) */}
          <a
            href="tel:+919871234567"
            className="flex items-center justify-between p-4 bg-canvas hover:bg-slate-100 rounded-card border border-hairline transition-transform active:scale-[0.98] text-left"
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Daytime Caregiver
              </div>
              <div className="text-base font-bold text-ink">{t.callCaregiver}</div>
              <div className="text-xs text-ink-muted font-mono">+91 98712 34567</div>
            </div>
            <span className="text-2xl" aria-hidden="true">📞</span>
          </a>
        </div>

        {/* Emergency Medical Call Box */}
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-card space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
            <span>🚨</span>
            <span>Emergency Services (India)</span>
          </div>
          <p className="text-xs text-rose-800 leading-relaxed font-medium">
            {t.emergencyNote}
          </p>
          <a
            href="tel:112"
            className="block text-center py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm rounded-full transition-colors shadow-sm"
          >
            Call National Emergency 112
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[52px] text-base font-semibold text-ink-secondary bg-canvas hover:bg-slate-200 rounded-full border border-hairline transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
