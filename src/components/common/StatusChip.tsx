import React from 'react';
import { AdherenceStatus } from '../../types';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';

interface StatusChipProps {
  status: AdherenceStatus | 'DISCONTINUED';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md' }) => {
  const language = useUserStore((s) => s.language);
  const t = translations[language].status;

  const config = {
    TAKEN: {
      label: t.taken,
      colorClass: 'text-[#1E7A45] bg-[#EAF5EF] border-[#1E7A45]/30',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
        </svg>
      ),
    },
    DUE: {
      label: t.due,
      colorClass: 'text-[#12605A] bg-[#DAEEEC] border-[#12605A]/30',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0 animate-pulse" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm.75 4.75v3.69l2.78 1.67a.75.75 0 1 1-.76 1.3L7.5 9.5V4.75a.75.75 0 0 1 1.5 0Z" />
        </svg>
      ),
    },
    NOT_YET: {
      label: t.notyet,
      colorClass: 'text-[#6B7776] bg-[#F4F7F7] border-[#6B7776]/30',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      ),
    },
    SKIPPED: {
      label: t.skipped,
      colorClass: 'text-[#A35A00] bg-[#FFF5E6] border-[#A35A00]/30',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.5 3a.75.75 0 0 0-.75.75v8.5a.75.75 0 0 0 1.28.53L9 8.78V12a.75.75 0 0 0 1.5 0V4a.75.75 0 0 0-1.5 0v3.22L5.03 3.22A.75.75 0 0 0 4.5 3Z" />
        </svg>
      ),
    },
    MISSED: {
      label: t.missed,
      colorClass: 'text-[#B42318] bg-[#FEE4E2] border-[#B42318]/30',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM7.25 4.5a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4Zm.75 7.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
        </svg>
      ),
    },
    DISCONTINUED: {
      label: t.discontinued,
      colorClass: 'text-[#475569] bg-[#F1F5F9] border-[#475569]/30',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14Zm0-1.5a5.5 5.5 0 0 0 3.73-9.54L3.96 11.73A5.47 5.47 0 0 0 8 13.5Zm-4.27-.46 7.77-7.77A5.5 5.5 0 0 0 3.73 13.04Z" />
        </svg>
      ),
    },
  }[status];

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium tabular-nums ${config.colorClass} ${sizeClasses}`}
      role="status"
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
