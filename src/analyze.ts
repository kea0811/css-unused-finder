import type { AnalysisReport, Finding } from './types';
import { parseStylesheet } from './parser';
import {
  findDuplicateSelectors,
  findImportant,
  findMagicZIndex,
  findSelectorIssues,
  gradeFor,
  scoreFragility,
} from './fragility';
import { findDeadClasses } from './deadClasses';

export interface AnalyzeInput {
  /** The stylesheet to inspect. */
  css: string;
  /** Optional HTML/JSX markup; enables dead-class detection when supplied. */
  markup?: string;
}

/**
 * Runs the full analysis: parses the stylesheet, collects every fragility
 * finding, scores and grades it, and (when markup is supplied) reports the
 * classes that nothing renders.
 */
export function analyze(input: AnalyzeInput): AnalysisReport {
  const rules = parseStylesheet(input.css);
  const findings: Finding[] = [];
  for (const rule of rules) {
    findings.push(...findImportant(rule));
    findings.push(...findMagicZIndex(rule));
    for (const selector of rule.selectors) {
      findings.push(...findSelectorIssues(selector));
    }
  }
  findings.push(...findDuplicateSelectors(rules));

  const selectors = rules.reduce((sum, rule) => sum + rule.selectors.length, 0);
  const declarations = rules.reduce((sum, rule) => sum + rule.declarations.length, 0);
  const fragilityScore = scoreFragility(findings, rules.length);

  return {
    stats: { rules: rules.length, selectors, declarations },
    findings,
    fragilityScore,
    grade: gradeFor(fragilityScore),
    deadClasses: findDeadClasses(rules, input.markup),
  };
}
