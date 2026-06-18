import type { Declaration, Rule } from './types';
import { readString } from './scan';

/** At-rules whose blocks contain nested style rules (rather than declarations). */
const NESTED_AT_RULES = ['media', 'supports', 'document', 'container', 'layer'];

/** Pulls the at-rule keyword from a prelude, e.g. `@media (...)` → `media`. */
export function atRuleName(prelude: string): string {
  const match = /^@([a-zA-Z-]+)/.exec(prelude);
  return match ? match[1].toLowerCase() : '';
}

/** True when an at-rule wraps nested style rules we should descend into. */
export function isNestedAtRule(prelude: string): boolean {
  return NESTED_AT_RULES.includes(atRuleName(prelude));
}

/**
 * Strips `/* … *​/` comments while leaving comment-like sequences inside string
 * literals untouched.
 */
export function stripComments(css: string): string {
  let out = '';
  let i = 0;
  const n = css.length;
  while (i < n) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      const end = readString(css, i);
      out += css.slice(i, end);
      i = end;
      continue;
    }
    if (ch === '/' && css[i + 1] === '*') {
      i += 2;
      while (i < n && !(css[i] === '*' && css[i + 1] === '/')) {
        i++;
      }
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/**
 * Splits `input` on `separator`, but only at the top level — separators inside
 * strings, `(…)` and `[…]` are ignored. Always returns at least one segment.
 */
export function splitTopLevel(input: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let i = 0;
  const n = input.length;
  while (i < n) {
    const ch = input[i];
    if (ch === '"' || ch === "'") {
      const end = readString(input, i);
      current += input.slice(i, end);
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
    if (ch === separator && depth === 0) {
      parts.push(current);
      current = '';
      i++;
      continue;
    }
    current += ch;
    i++;
  }
  parts.push(current);
  return parts;
}

/** Parses a declaration block body (the text between `{` and `}`). */
export function parseDeclarations(block: string): Declaration[] {
  const declarations: Declaration[] = [];
  for (const part of splitTopLevel(block, ';')) {
    const trimmed = part.trim();
    if (trimmed === '') {
      continue;
    }
    const colon = trimmed.indexOf(':');
    if (colon === -1) {
      continue;
    }
    const property = trimmed.slice(0, colon).trim();
    if (property === '') {
      continue;
    }
    let value = trimmed.slice(colon + 1).trim();
    const bang = /!\s*important\s*$/i.exec(value);
    let important = false;
    if (bang) {
      important = true;
      value = value.slice(0, bang.index).trim();
    }
    declarations.push({ property, value, important });
  }
  return declarations;
}

/** Finds the `}` that closes a declaration block opened at `open`. */
function findBlockEnd(s: string, open: number): number {
  let i = open + 1;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      i = readString(s, i);
      continue;
    }
    if (ch === '}') {
      return i;
    }
    i++;
  }
  return n;
}

/** Skips an entire brace-balanced block (e.g. `@keyframes`) opened at `open`. */
function skipBlock(s: string, open: number): number {
  let depth = 0;
  let i = open;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      i = readString(s, i);
      continue;
    }
    if (ch === '{') {
      depth++;
      i++;
      continue;
    }
    if (ch === '}') {
      depth--;
      i++;
      if (depth === 0) {
        return i;
      }
      continue;
    }
    i++;
  }
  return n;
}

/**
 * Parses a stylesheet into a flat list of style rules. `@media`/`@supports`-style
 * wrappers are transparent (their inner rules carry the prelude as `media`);
 * declaration-only at-rules such as `@keyframes` and `@font-face` are skipped.
 */
export function parseStylesheet(css: string): Rule[] {
  const clean = stripComments(css);
  const rules: Rule[] = [];
  const mediaStack: string[] = [];
  let buffer = '';
  let i = 0;
  const n = clean.length;
  while (i < n) {
    const ch = clean[i];
    if (ch === '"' || ch === "'") {
      const end = readString(clean, i);
      buffer += clean.slice(i, end);
      i = end;
      continue;
    }
    if (ch === ';') {
      // A statement at-rule like `@import "x";` — discard its prelude.
      buffer = '';
      i++;
      continue;
    }
    if (ch === '{') {
      const prelude = buffer.trim();
      buffer = '';
      if (prelude.startsWith('@')) {
        if (isNestedAtRule(prelude)) {
          mediaStack.push(prelude);
          i++;
          continue;
        }
        i = skipBlock(clean, i);
        continue;
      }
      const blockEnd = findBlockEnd(clean, i);
      const declarations = parseDeclarations(clean.slice(i + 1, blockEnd));
      const selectors = splitTopLevel(prelude, ',')
        .map((s) => s.trim())
        .filter((s) => s !== '');
      rules.push({
        selectors,
        declarations,
        media: mediaStack.length > 0 ? mediaStack[mediaStack.length - 1] : null,
      });
      i = blockEnd + 1;
      continue;
    }
    if (ch === '}') {
      if (mediaStack.length > 0) {
        mediaStack.pop();
      }
      buffer = '';
      i++;
      continue;
    }
    buffer += ch;
    i++;
  }
  return rules;
}
