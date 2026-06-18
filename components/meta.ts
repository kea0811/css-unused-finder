import type { FindingKind, Grade, Severity } from '@/src';

export const KIND_LABEL: Record<FindingKind, string> = {
  important: '!important',
  'id-selector': 'ID selector',
  overqualified: 'Overqualified',
  'deep-nesting': 'Deep nesting',
  universal: 'Universal selector',
  'high-specificity': 'High specificity',
  'magic-zindex': 'Magic z-index',
  'duplicate-selector': 'Duplicate selector',
};

export const SEVERITY_STYLE: Record<Severity, { dot: string; text: string; label: string }> = {
  high: { dot: 'bg-grade-f', text: 'text-grade-f', label: 'High' },
  medium: { dot: 'bg-grade-c', text: 'text-grade-c', label: 'Medium' },
  low: { dot: 'bg-sky-400', text: 'text-sky-300', label: 'Low' },
};

export const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export const GRADE_COLOR: Record<Grade, string> = {
  A: 'text-grade-a',
  B: 'text-grade-b',
  C: 'text-grade-c',
  D: 'text-grade-d',
  F: 'text-grade-f',
};

export const GRADE_RING: Record<Grade, string> = {
  A: 'border-grade-a/60 shadow-[0_0_40px_-12px] shadow-grade-a/50',
  B: 'border-grade-b/60 shadow-[0_0_40px_-12px] shadow-grade-b/50',
  C: 'border-grade-c/60 shadow-[0_0_40px_-12px] shadow-grade-c/50',
  D: 'border-grade-d/60 shadow-[0_0_40px_-12px] shadow-grade-d/50',
  F: 'border-grade-f/60 shadow-[0_0_40px_-12px] shadow-grade-f/50',
};
