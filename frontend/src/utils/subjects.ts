import type { Subject } from '../types';

export const SUBJECT_OPTIONS: { value: Subject; label: string }[] = [
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'ROMANIAN', label: 'Romanian' },
  { value: 'ENGLISH', label: 'English' },
  { value: 'FRENCH', label: 'French' },
  { value: 'PHYSICS', label: 'Physics' },
  { value: 'CHEMISTRY', label: 'Chemistry' },
  { value: 'BIOLOGY', label: 'Biology' },
  { value: 'HISTORY', label: 'History' },
  { value: 'GEOGRAPHY', label: 'Geography' },
  { value: 'COMPUTER_SCIENCE', label: 'Computer science' },
  { value: 'PHYSICAL_EDUCATION', label: 'Physical education' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'ART', label: 'Art' },
];

export function subjectLabel(subject: Subject): string {
  return SUBJECT_OPTIONS.find((option) => option.value === subject)?.label ?? subject;
}
