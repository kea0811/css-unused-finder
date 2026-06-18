/** A single `property: value` pair inside a rule's declaration block. */
export interface Declaration {
  property: string;
  value: string;
  important: boolean;
}

/** One style rule: its comma-separated selectors plus the declarations it holds. */
export interface Rule {
  /** Individual selectors, already split on top-level commas and trimmed. */
  selectors: string[];
  declarations: Declaration[];
  /** The enclosing at-rule prelude (e.g. `@media (...)`), or null at top level. */
  media: string | null;
}

/** CSS specificity as the classic (a, b, c) triple. */
export interface Specificity {
  /** ID selectors. */
  a: number;
  /** Classes, attributes and pseudo-classes. */
  b: number;
  /** Element names and pseudo-elements. */
  c: number;
}

export type Severity = 'low' | 'medium' | 'high';

export type FindingKind =
  | 'important'
  | 'id-selector'
  | 'overqualified'
  | 'deep-nesting'
  | 'universal'
  | 'high-specificity'
  | 'magic-zindex'
  | 'duplicate-selector';

/** A single fragility signal surfaced by the analyzer. */
export interface Finding {
  kind: FindingKind;
  selector: string;
  message: string;
  severity: Severity;
}

/** The dead-class portion of the report. */
export interface DeadClassReport {
  /** Every class referenced by the stylesheet, sorted and de-duplicated. */
  definedClasses: string[];
  /** Defined classes that DO appear in the supplied markup. */
  usedClasses: string[];
  /** Defined classes that never appear in the supplied markup. */
  unusedClasses: string[];
  /** Whether markup was supplied — without it, dead-class detection is skipped. */
  markupProvided: boolean;
}

export interface Stats {
  rules: number;
  selectors: number;
  declarations: number;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

/** The complete result returned by {@link analyze}. */
export interface AnalysisReport {
  stats: Stats;
  findings: Finding[];
  /** 0 (rock solid) → 100 (extremely fragile). */
  fragilityScore: number;
  grade: Grade;
  deadClasses: DeadClassReport;
}
