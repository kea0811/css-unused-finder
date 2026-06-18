import type { DeadClassReport, Rule } from './types';
import { matchBracket, readString } from './scan';

/**
 * Pulls every class name out of a single selector. Attribute selectors are
 * skipped so a `.` inside `[data-x=".foo"]` is not mistaken for a class. Escaped
 * characters (e.g. Tailwind's `.w-1\/2`) terminate the name early — a documented
 * limitation rather than a crash.
 */
export function extractClassesFromSelector(selector: string): string[] {
  const classes: string[] = [];
  let i = 0;
  const n = selector.length;
  while (i < n) {
    const ch = selector[i];
    if (ch === '"' || ch === "'") {
      i = readString(selector, i);
      continue;
    }
    if (ch === '[') {
      i = matchBracket(selector, i);
      continue;
    }
    if (ch === '.') {
      let j = i + 1;
      while (j < n && /[\w-]/.test(selector[j])) {
        j++;
      }
      const name = selector.slice(i + 1, j);
      if (name !== '') {
        classes.push(name);
      }
      i = j;
      continue;
    }
    i++;
  }
  return classes;
}

/** Every class referenced by the stylesheet, de-duplicated and sorted. */
export function extractDefinedClasses(rules: Rule[]): string[] {
  const set = new Set<string>();
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      for (const cls of extractClassesFromSelector(selector)) {
        set.add(cls);
      }
    }
  }
  return [...set].sort();
}

/**
 * Collects the class tokens that appear in HTML/JSX markup. Reads `class="…"`,
 * `class='…'` and `className={…}` attribute values, then splits each on any
 * non-identifier character. This is deliberately permissive: tokens from dynamic
 * expressions count as "used", so the tool never tells you to delete a class it
 * merely failed to understand.
 */
export function extractClassesFromMarkup(markup: string): Set<string> {
  const used = new Set<string>();
  const attr = /class(?:Name)?\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
  let match: RegExpExecArray | null;
  while ((match = attr.exec(markup)) !== null) {
    let raw: string;
    if (match[1] !== undefined) {
      raw = match[1];
    } else if (match[2] !== undefined) {
      raw = match[2];
    } else {
      raw = match[3];
    }
    for (const token of raw.split(/[^\w-]+/)) {
      if (token !== '') {
        used.add(token);
      }
    }
  }
  return used;
}

/**
 * Builds the dead-class report. Without markup, detection is skipped and only the
 * defined-class inventory is returned.
 */
export function findDeadClasses(rules: Rule[], markup?: string): DeadClassReport {
  const definedClasses = extractDefinedClasses(rules);
  if (markup === undefined || markup.trim() === '') {
    return {
      definedClasses,
      usedClasses: [],
      unusedClasses: [],
      markupProvided: false,
    };
  }
  const used = extractClassesFromMarkup(markup);
  const usedClasses = definedClasses.filter((cls) => used.has(cls));
  const unusedClasses = definedClasses.filter((cls) => !used.has(cls));
  return { definedClasses, usedClasses, unusedClasses, markupProvided: true };
}
