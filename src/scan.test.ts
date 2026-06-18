import { describe, expect, it } from 'vitest';
import { matchBracket, matchParen, readString } from './scan';

describe('readString', () => {
  it('returns the index past a closed string', () => {
    expect(readString('"ab"x', 0)).toBe(4);
  });

  it('handles single quotes', () => {
    expect(readString("'ab'", 0)).toBe(4);
  });

  it('treats a backslash as escaping the next character', () => {
    // The escaped quote should not close the string.
    expect(readString('"a\\"b"', 0)).toBe(6);
  });

  it('consumes to end-of-string when unterminated', () => {
    expect(readString('"abc', 0)).toBe(4);
  });

  it('stops when a trailing backslash runs off the end', () => {
    expect(readString('"a\\', 0)).toBe(3);
  });
});

describe('matchBracket', () => {
  it('returns the index past a closing bracket', () => {
    expect(matchBracket('[abc]d', 0)).toBe(5);
  });

  it('ignores a bracket inside a quoted value', () => {
    expect(matchBracket('[x="]"]', 0)).toBe(7);
  });

  it('consumes to end when unterminated', () => {
    expect(matchBracket('[abc', 0)).toBe(4);
  });
});

describe('matchParen', () => {
  it('returns the index past a balanced close', () => {
    expect(matchParen('(a)b', 0)).toBe(3);
  });

  it('honors nested parentheses', () => {
    expect(matchParen('(a(b)c)d', 0)).toBe(7);
  });

  it('skips parens inside strings', () => {
    expect(matchParen('(")")', 0)).toBe(5);
  });

  it('consumes to end when unbalanced', () => {
    expect(matchParen('(a(b)', 0)).toBe(5);
  });
});
