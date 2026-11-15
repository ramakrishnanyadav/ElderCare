import React from 'react';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';

interface EvidenceMixBarProps {
  stats?: {
    patientReported: number;
    witnessed: number;
    clinician: number;
    device: number;
    unknown: number;
  };
}

export const EvidenceMixBar: React.FC<EvidenceMixBarProps> = ({
  stats = {
    patientReported: 18,
    witnessed: 8,
    clinician: 2,
    device: 0,
    unknown: 1,
  },
}) => {
  const language = useUserStore((s) => s.language);
  const t = translations[language].evidence;
  const helpText = translations[language].family.evidenceMixHelp;

  const total =
    stats.patientReported +
    stats.witnessed +
    stats.clinician +
    stats.device +
    stats.unknown;

  const pPct = total > 0 ? (stats.patientReported / total) * 100 : 0;
  const wPct = total > 0 ? (stats.witnessed / total) * 100 : 0;
  const cPct = total > 0 ? (stats.clinician / total) * 100 : 0;
  const dPct = total > 0 ? (stats.device / total) * 100 : 0;
  const uPct = total > 0 ? (stats.unknown / total) * 100 : 0;

  return (
    <div className="card-premium rounded-card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-ink text-base">
            {translations[language].family.evidenceMixTitle}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">{helpText}</p>
        </div>
        <div className="text-xs font-medium text-ink-secondary bg-canvas px-3 py-1 rounded-full border border-hairline self-start sm:self-auto">
          {total} total recorded events
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div
        className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 p-0.5 border border-hairline"
        role="progressbar"
        aria-label="Adherence evidence distribution"
        aria-valuenow={Math.round(pPct + wPct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {pPct > 0 && (
          <div
            style={{ width: `${pPct}%` }}
            className="h-full bg-teal-600 rounded-l-full transition-all duration-300 relative group"
            title={`${t.PATIENT_REPORTED}: ${stats.patientReported} (${Math.round(pPct)}%)`}
          />
        )}
        {wPct > 0 && (
          <div
            style={{ width: `${wPct}%` }}
            className="h-full bg-emerald-600 transition-all duration-300 relative group"
            title={`${t.CAREGIVER_WITNESSED}: ${stats.witnessed} (${Math.round(wPct)}%)`}
          />
        )}
        {cPct > 0 && (
          <div
            style={{ width: `${cPct}%` }}
            className="h-full bg-blue-600 transition-all duration-300 relative group"
            title={`${t.CLINICIAN_RECORDED}: ${stats.clinician} (${Math.round(cPct)}%)`}
          />
        )}
        {dPct > 0 && (
          <div
            style={{ width: `${dPct}%` }}
            className="h-full bg-purple-600 transition-all duration-300 relative group"
            title={`${t.DEVICE_RECORDED}: ${stats.device} (${Math.round(dPct)}%)`}
          />
        )}
        {uPct > 0 && (
          <div
            style={{ width: `${uPct}%` }}
            className="h-full bg-stone-400 rounded-r-full transition-all duration-300 relative group"
            title={`${t.UNKNOWN}: ${stats.unknown} (${Math.round(uPct)}%)`}
          />
        )}
      </div>

      {/* Legend with exact counts & proportions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-teal-600 shrink-0" />
          <span className="text-ink-secondary truncate">
            {t.PATIENT_REPORTED}: <strong className="text-ink">{stats.patientReported}</strong> ({Math.round(pPct)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-emerald-600 shrink-0" />
          <span className="text-ink-secondary truncate">
            {t.CAREGIVER_WITNESSED}: <strong className="text-ink">{stats.witnessed}</strong> ({Math.round(wPct)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-blue-600 shrink-0" />
          <span className="text-ink-secondary truncate">
            {t.CLINICIAN_RECORDED}: <strong className="text-ink">{stats.clinician}</strong> ({Math.round(cPct)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-purple-600 shrink-0" />
          <span className="text-ink-secondary truncate">
            {t.DEVICE_RECORDED}: <strong className="text-ink">{stats.device}</strong> ({Math.round(dPct)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-stone-400 shrink-0" />
          <span className="text-ink-secondary truncate">
            {t.UNKNOWN}: <strong className="text-ink">{stats.unknown}</strong> ({Math.round(uPct)}%)
          </span>
        </div>
      </div>
    </div>
  );
};
