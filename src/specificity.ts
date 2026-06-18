import type { Specificity } from './types';
import { matchBracket, matchParen, readString } from './scan';

/** Legacy single-colon pseudo-elements that still count toward `c`. */
const LEGACY_PSEUDO_ELEMENTS = new Set(['before', 'after', 'first-line', 'first-letter']);

/** Functional pseudo-classes that take a selector list (`:not`, `:is`, `:has`, …). */
const SELECTOR_FN_PSEUDOS = new Set(['not', 'is', 'has', 'matches']);

function isIdentChar(ch: string): boolean {
  return /[\w-]/.test(ch);
}

/** Reads an identifier starting at `i`, returning `[ident, nextIndex]`. */
function readIdent(s: string, i: number): [string, number] {
  let j = i;
  const n = s.length;
  while (j < n && isIdentChar(s[j])) {
    j++;
  }
  return [s.slice(i, j), j];
}

/** A single number for ordering: an ID always outranks any number of classes. */
export function specificityScore(spec: Specificity): number {
  return spec.a * 100 + spec.b * 10 + spec.c;
}

/**
 * Splits a complex selector into its compound selectors, dropping combinators
 * (descendant, `>`, `+`, `~`). Whitespace and combinators inside `(…)`/`[…]` and
 * strings are preserved. Used to measure how deeply a selector is nested.
 */
export function splitCompounds(selector: string): string[] {
  const compounds: string[] = [];
  let current = '';
  let depth = 0;
  let i = 0;
  const s = selector;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      const end = readString(s, i);
      current += s.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '(' || ch === '[') {
      depth++;
      current += ch;
      i++;
      continue;
    }
    if (ch === ')' || ch === ']') {
      depth--;
      current += ch;
      i++;
      continue;
    }
    const isCombinator = ch === '>' || ch === '+' || ch === '~';
    const isSpace = ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
    if (depth === 0 && (isCombinator || isSpace)) {
      if (current.trim() !== '') {
        compounds.push(current.trim());
        current = '';
      }
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  if (current.trim() !== '') {
    compounds.push(current.trim());
  }
  return compounds;
}

/** Returns the highest-specificity entry of a comma-separated selector list. */
function maxSpecificityOfList(list: string): Specificity {
  let best: Specificity = { a: 0, b: 0, c: 0 };
  let i = 0;
  let current = '';
  const n = list.length;
  const consider = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return;
    }
    const spec = computeSpecificity(trimmed);
    if (specificityScore(spec) > specificityScore(best)) {
      best = spec;
    }
  };
  while (i < n) {
    const ch = list[i];
    if (ch === '"' || ch === "'") {
      const end = readString(list, i);
      current += list.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '(' || ch === '[') {
      const end = ch === '(' ? matchParen(list, i) : matchBracket(list, i);
      current += list.slice(i, end);
      i = end;
      continue;
    }
    if (ch === ',') {
      consider(current);
      current = '';
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  consider(current);
  return best;
}

/**
 * Computes the (a, b, c) specificity of a single complex selector. Handles IDs,
 * classes, attributes, pseudo-classes, pseudo-elements (`::x` and the four legacy
 * `:x` forms), the universal selector, and functional pseudo-classes:
 * `:where()` contributes nothing, while `:not()`/`:is()`/`:has()` contribute the
 * specificity of their most specific argument.
 */
export function computeSpecificity(selector: string): Specificity {
  let a = 0;
  let b = 0;
  let c = 0;
  let i = 0;
  const s = selector;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '#') {
      const [, next] = readIdent(s, i + 1);
      a++;
      i = next;
      continue;
    }
    if (ch === '.') {
      const [, next] = readIdent(s, i + 1);
      b++;
      i = next;
      continue;
    }
    if (ch === '[') {
      i = matchBracket(s, i);
      b++;
      continue;
    }
    if (ch === ':') {
      if (s[i + 1] === ':') {
        const [, next] = readIdent(s, i + 2);
        c++;
        i = next;
        continue;
      }
      const [name, afterName] = readIdent(s, i + 1);
      const lower = name.toLowerCase();
      if (s[afterName] === '(') {
        const close = matchParen(s, afterName);
        const inner = s.slice(afterName + 1, close - 1);
        if (lower === 'where') {
          // Zero specificity, by spec.
        } else if (SELECTOR_FN_PSEUDOS.has(lower)) {
          const inSpec = maxSpecificityOfList(inner);
          a += inSpec.a;
          b += inSpec.b;
          c += inSpec.c;
        } else {
          b++;
        }
        i = close;
        continue;
      }
      if (LEGACY_PSEUDO_ELEMENTS.has(lower)) {
        c++;
      } else {
        b++;
      }
      i = afterName;
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      const [, next] = readIdent(s, i);
      c++;
      i = next;
      continue;
    }
    // Combinators, whitespace, `*`, commas, stray punctuation — no contribution.
    i++;
  }
  return { a, b, c };
}
