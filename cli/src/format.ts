import type { AnalysisReport, Finding, Grade, Severity } from '../../src';
import type { Colors } from './color.js';

/** Options controlling how a {@link AnalysisReport} is rendered. */
export interface FormatOptions {
  /** A label (file name) shown at the top of the report. */
  label: string;
  /** The palette to paint with. */
  colors: Colors;
}

/** Letter grades from best to worst — the order the gate compares against. */
const GRADE_ORDER: readonly Grade[] = ['A', 'B', 'C', 'D', 'F'] as const;

/** Severities in the order findings are grouped (worst first). */
const SEVERITY_ORDER: readonly Severity[] = ['high', 'medium', 'low'] as const;

const SEVERITY_LABEL: Record<Severity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

/** Numeric rank of a grade; lower is healthier. `A` → 0, `F` → 4. */
export function gradeRank(grade: Grade): number {
  return GRADE_ORDER.indexOf(grade);
}

/**
 * True when `grade` is strictly worse than `min` (e.g. a `C` against a `--min-grade B`).
 * This is the predicate behind the CI gate's non-zero exit.
 */
export function gradeBelow(grade: Grade, min: Grade): boolean {
  return gradeRank(grade) > gradeRank(min);
}

/** Validate and normalize a `--min-grade` argument, or `null` if it isn't A–F. */
export function parseGrade(value: string): Grade | null {
  const upper = value.trim().toUpperCase();
  return (GRADE_ORDER as readonly string[]).includes(upper) ? (upper as Grade) : null;
}

/** Paint a grade with the color that matches how healthy it is. */
function paintGrade(grade: Grade, colors: Colors): string {
  switch (grade) {
    case 'A':
    case 'B':
      return colors.green(colors.bold(grade));
    case 'C':
      return colors.yellow(colors.bold(grade));
    default:
      return colors.red(colors.bold(grade));
  }
}

/** Paint a severity tag with a heat color. */
function paintSeverity(severity: Severity, text: string, colors: Colors): string {
  switch (severity) {
    case 'high':
      return colors.red(text);
    case 'medium':
      return colors.yellow(text);
    default:
      return colors.dim(text);
  }
}

/** Render the prominent score + grade banner shown at the top of every report. */
function renderHeadline(report: AnalysisReport, label: string, colors: Colors): string[] {
  const { fragilityScore, grade } = report;
  return [
    colors.bold(label),
    `  ${colors.dim('fragility')}  ${paintGrade(grade, colors)}  ${colors.dim(
      `(${fragilityScore}/100, 0 = rock solid → 100 = extremely fragile)`,
    )}`,
  ];
}

/** Render the findings, grouped high → medium → low. */
function renderFindings(findings: Finding[], colors: Colors): string[] {
  const lines: string[] = [];
  for (const severity of SEVERITY_ORDER) {
    const group = findings.filter((finding) => finding.severity === severity);
    if (group.length === 0) {
      continue;
    }
    const tag = paintSeverity(severity, `${SEVERITY_LABEL[severity]} (${group.length})`, colors);
    lines.push('');
    lines.push(`  ${tag}`);
    for (const finding of group) {
      lines.push(`    ${colors.cyan(finding.selector)}`);
      lines.push(`      ${colors.dim(finding.message)}`);
    }
  }
  return lines;
}

/** Render the dead-class section — only meaningful when markup was supplied. */
function renderDeadClasses(report: AnalysisReport, colors: Colors): string[] {
  const { deadClasses } = report;
  if (!deadClasses.markupProvided) {
    return [];
  }
  const { unusedClasses, definedClasses } = deadClasses;
  const lines: string[] = ['', `  ${colors.magenta(`Dead classes (${unusedClasses.length})`)}`];
  if (unusedClasses.length === 0) {
    lines.push(
      `    ${colors.green(`✓ all ${definedClasses.length} defined classes appear in the markup`)}`,
    );
    return lines;
  }
  for (const cls of unusedClasses) {
    lines.push(`    ${colors.red(`.${cls}`)}  ${colors.dim('— defined but never used in the markup')}`);
  }
  return lines;
}

/** Render the one-line stats footer. */
function renderFooter(report: AnalysisReport, colors: Colors): string[] {
  const { rules, selectors, declarations } = report.stats;
  return [
    '',
    `  ${colors.dim(`${rules} rules · ${selectors} selectors · ${declarations} declarations`)}`,
  ];
}

/**
 * Render a single {@link AnalysisReport} as a colored terminal report:
 * a fragility score + grade headline, findings grouped by severity, dead
 * classes (when markup was supplied), and a stats footer.
 */
export function formatReport(report: AnalysisReport, options: FormatOptions): string {
  const { colors, label } = options;
  const lines: string[] = [...renderHeadline(report, label, colors)];

  if (report.findings.length === 0) {
    lines.push('');
    lines.push(`  ${colors.green('✓ no fragility findings')}`);
  } else {
    lines.push(...renderFindings(report.findings, colors));
  }

  lines.push(...renderDeadClasses(report, colors));
  lines.push(...renderFooter(report, colors));
  return lines.join('\n');
}
