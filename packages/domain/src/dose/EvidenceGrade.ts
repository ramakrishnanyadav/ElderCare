export type EvidenceGrade =
  | 'PATIENT_REPORTED'
  | 'CAREGIVER_WITNESSED'
  | 'CLINICIAN_RECORDED'
  | 'DEVICE_RECORDED'
  | 'UNKNOWN';

export const VALID_EVIDENCE_GRADES: readonly EvidenceGrade[] = [
  'PATIENT_REPORTED',
  'CAREGIVER_WITNESSED',
  'CLINICIAN_RECORDED',
  'DEVICE_RECORDED',
  'UNKNOWN',
] as const;

export function isValidEvidenceGrade(grade: string): grade is EvidenceGrade {
  return VALID_EVIDENCE_GRADES.includes(grade as EvidenceGrade);
}
