import type { Finding, Grade, Rule, Severity } from './types';
import { readString } from './scan';
import { computeSpecificity, splitCompounds } from './specificity';

/** A descendant chain at or beyond this many compounds is flagged as brittle. */
export const DEEP_NESTING_THRESHOLD = 4;
/** Class/attribute/pseudo-class count (with no ID) that reads as over-specific. */
export const HIGH_SPECIFICITY_THRESHOLD = 4;
/** `z-index` values at or above this are treated as fragile "magic" numbers. */
export const MAGIC_ZINDEX_THRESHOLD = 1000;

const SEVERITY_WEIGHT: Record<Severity, number> = { low: 1, medium: 3, high: 6 };

/** Joins a rule's selectors back into a readable label for a finding. */
function label(rule: Rule): string {
  return rule.selectors.join(', ');
}

/** Flags every `!important` declaration in a rule. */
export function findImportant(rule: Rule): Finding[] {
  const findings: Finding[] = [];
  for (const decl of rule.declarations) {
    if (decl.important) {
      findings.push({
        kind: 'important',
        selector: label(rule),
        message: `\`${decl.property}\` is marked !important — that wins specificity battles and forces the next override to escalate too.`,
        severity: 'high',
      });
    }
  }
  return findings;
}

/** Flags large `z-index` values that hint at an unmanaged stacking context. */
export function findMagicZIndex(rule: Rule): Finding[] {
  const findings: Finding[] = [];
  for (const decl of rule.declarations) {
    if (decl.property.toLowerCase() !== 'z-index') {
      continue;
    }
    const value = Number.parseInt(decl.value, 10);
    if (!Number.isNaN(value) && Math.abs(value) >= MAGIC_ZINDEX_THRESHOLD) {
      findings.push({
        kind: 'magic-zindex',
        selector: label(rule),
        message: `z-index: ${decl.value} is a magic number — large stacking values usually paper over a layering bug.`,
        severity: 'low',
      });
    }
  }
  return findings;
}

/** True if `*` appears outside of strings, `(…)` and `[…]`. */
export function containsUniversal(selector: string): boolean {
  let depth = 0;
  let i = 0;
  const n = selector.length;
  while (i < n) {
    const ch = selector[i];
    if (ch === '"' || ch === "'") {
      i = readString(selector, i);
      continue;
    }
    if (ch === '[' || ch === '(') {
      depth++;
      i++;
      continue;
    }
    if (ch === ']' || ch === ')') {
      depth--;
      i++;
      continue;
    }
    if (ch === '*' && depth === 0) {
      return true;
    }
    i++;
  }
  return false;
}

/** True for a compound that pins a class/id/attribute to a specific tag name. */
export function isOverqualified(compound: string): boolean {
  return /^[a-zA-Z][\w-]*[.#[]/.test(compound.trim());
}

/** Runs every selector-level fragility check against one selector. */
export function findSelectorIssues(selector: string): Finding[] {
  const findings: Finding[] = [];
  const compounds = splitCompounds(selector);
  if (compounds.length >= DEEP_NESTING_THRESHOLD) {
    findings.push({
      kind: 'deep-nesting',
      selector,
      message: `${compounds.length} levels deep — long descendant chains shatter the moment the markup is reshuffled.`,
      severity: 'medium',
    });
  }
  if (compounds.some(isOverqualified)) {
    findings.push({
      kind: 'overqualified',
      selector,
      message: `Overqualified (e.g. \`ul.nav\`) — the tag name locks the rule to one element and adds needless specificity.`,
      severity: 'medium',
    });
  }
  if (containsUniversal(selector)) {
    findings.push({
      kind: 'universal',
      selector,
      message: `The universal selector (*) matches every element — easy to write, hard to reason about.`,
      severity: 'low',
    });
  }
  const spec = computeSpecificity(selector);
  if (spec.a >= 1) {
    findings.push({
      kind: 'id-selector',
      selector,
      message: `ID selector (${spec.a},${spec.b},${spec.c}) — only another ID can override it, so reuse and theming get painful.`,
      severity: 'high',
    });
  } else if (spec.b >= HIGH_SPECIFICITY_THRESHOLD) {
    findings.push({
      kind: 'high-specificity',
      selector,
      message: `High specificity (${spec.a},${spec.b},${spec.c}) — this rule will be stubborn to override later.`,
      severity: 'medium',
    });
  }
  return findings;
}

/** Flags selectors that are declared more than once across the stylesheet. */
export function findDuplicateSelectors(rules: Rule[]): Finding[] {
  const counts = new Map<string, number>();
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      const key = selector.replace(/\s+/g, ' ').trim();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const findings: Finding[] = [];
  for (const [key, count] of counts) {
    if (count > 1) {
      findings.push({
        kind: 'duplicate-selector',
        selector: key,
        message: `Declared ${count} times — scattered duplicates make the cascade order load-bearing and easy to break.`,
        severity: 'low',
      });
    }
  }
  return findings;
}

/** Collapses the weighted findings into a 0–100 fragility score. */
export function scoreFragility(findings: Finding[], ruleCount: number): number {
  const weight = findings.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  const denom = Math.max(ruleCount, 1);
  const raw = (weight / denom) * 12;
  return Math.min(100, Math.round(raw));
}

/** Maps a fragility score onto a familiar letter grade. */
export function gradeFor(score: number): Grade {
  if (score <= 10) {
    return 'A';
  }
  if (score <= 25) {
    return 'B';
  }
  if (score <= 50) {
    return 'C';
  }
  if (score <= 75) {
    return 'D';
  }
  return 'F';
}
