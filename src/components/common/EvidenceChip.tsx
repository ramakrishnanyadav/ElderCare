import React from 'react';
import { EvidenceGrade } from '../../types';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';

interface EvidenceChipProps {
  grade: EvidenceGrade;
  size?: 'sm' | 'md';
}

export const EvidenceChip: React.FC<EvidenceChipProps> = ({ grade, size = 'md' }) => {
  const language = useUserStore((s) => s.language);
  const t = translations[language].evidence;

  const config = {
    PATIENT_REPORTED: {
      label: t.PATIENT_REPORTED,
      bg: 'bg-teal-50 text-teal-800 border-teal-200',
      icon: '👤',
    },
    CAREGIVER_WITNESSED: {
      label: t.CAREGIVER_WITNESSED,
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: '👀',
    },
    CLINICIAN_RECORDED: {
      label: t.CLINICIAN_RECORDED,
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: '🩺',
    },
    DEVICE_RECORDED: {
      label: t.DEVICE_RECORDED,
      bg: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: '📱',
    },
    UNKNOWN: {
      label: t.UNKNOWN,
      bg: 'bg-stone-50 text-stone-700 border-stone-200',
      icon: '❓',
    },
  }[grade];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums ${config.bg}`}
      title={`Evidence Grade: ${config.label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
