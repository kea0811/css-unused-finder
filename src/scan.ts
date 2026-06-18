/**
 * Low-level character scanners shared by the parser, the specificity engine and
 * the class extractor. Each one takes the source string plus a start index and
 * returns the index to continue from — they never throw and always terminate,
 * even on malformed input (an unterminated token just consumes to end-of-string).
 */

/**
 * `s[start]` is a quote character. Returns the index just past the matching
 * closing quote, or `s.length` if the string is never closed. Backslash escapes
 * the next character.
 */
export function readString(s: string, start: number): number {
  const quote = s[start];
  let i = start + 1;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return i + 1;
    }
    i++;
  }
  return n;
}

/**
 * `s[open]` is `[`. Returns the index just past the matching `]`, skipping any
 * quoted strings inside the attribute selector. Returns `s.length` if unclosed.
 */
export function matchBracket(s: string, open: number): number {
  let i = open + 1;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      i = readString(s, i);
      continue;
    }
    if (ch === ']') {
      return i + 1;
    }
    i++;
  }
  return n;
}

/**
 * `s[open]` is `(`. Returns the index just past the matching `)`, honoring nested
 * parentheses and skipping quoted strings. Returns `s.length` if unbalanced.
 */
export function matchParen(s: string, open: number): number {
  let depth = 0;
  let i = open;
  const n = s.length;
  while (i < n) {
    const ch = s[i];
    if (ch === '"' || ch === "'") {
      i = readString(s, i);
      continue;
    }
    if (ch === '(') {
      depth++;
      i++;
      continue;
    }
    if (ch === ')') {
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
