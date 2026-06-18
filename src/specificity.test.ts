import { describe, expect, it } from 'vitest';
import { computeSpecificity, specificityScore, splitCompounds } from './specificity';

describe('specificityScore', () => {
  it('ranks an ID above any number of classes', () => {
    expect(specificityScore({ a: 1, b: 0, c: 0 })).toBe(100);
    expect(specificityScore({ a: 0, b: 9, c: 0 })).toBe(90);
    expect(specificityScore({ a: 0, b: 0, c: 5 })).toBe(5);
  });
});

describe('computeSpecificity', () => {
  it('counts an ID', () => {
    expect(computeSpecificity('#id')).toEqual({ a: 1, b: 0, c: 0 });
  });

  it('counts a class', () => {
    expect(computeSpecificity('.box')).toEqual({ a: 0, b: 1, c: 0 });
  });

  it('counts an attribute selector with a quoted value', () => {
    expect(computeSpecificity('[data-x="y"]')).toEqual({ a: 0, b: 1, c: 0 });
  });

  it('counts a double-colon pseudo-element', () => {
    expect(computeSpecificity('::before')).toEqual({ a: 0, b: 0, c: 1 });
  });

  it('counts a legacy single-colon pseudo-element', () => {
    expect(computeSpecificity(':before')).toEqual({ a: 0, b: 0, c: 1 });
  });

  it('counts a plain pseudo-class', () => {
    expect(computeSpecificity(':hover')).toEqual({ a: 0, b: 1, c: 0 });
  });

  it('counts an element name', () => {
    expect(computeSpecificity('div')).toEqual({ a: 0, b: 0, c: 1 });
  });

  it('ignores the universal selector', () => {
    expect(computeSpecificity('*')).toEqual({ a: 0, b: 0, c: 0 });
  });

  it('drops the :where() keyword and its arguments', () => {
    expect(computeSpecificity(':where(.a, #b)')).toEqual({ a: 0, b: 0, c: 0 });
  });

  it('adds the most specific argument of :is()', () => {
    expect(computeSpecificity(':is(#a, .b)')).toEqual({ a: 1, b: 0, c: 0 });
  });

  it('counts only the matching class inside :not()', () => {
    expect(computeSpecificity(':not(.a)')).toEqual({ a: 0, b: 1, c: 0 });
  });

  it('treats a non-selector functional pseudo as one pseudo-class', () => {
    expect(computeSpecificity(':nth-child(2n)')).toEqual({ a: 0, b: 1, c: 0 });
  });

  it('handles nested parens and brackets inside a selector list', () => {
    // `.y[data]` contributes two b's, so it is the most specific argument.
    expect(computeSpecificity(':is(:not(.x), .y[data])')).toEqual({ a: 0, b: 2, c: 0 });
  });

  it('scans a top-level string inside a list argument', () => {
    expect(computeSpecificity(":is('x', .a)")).toEqual({ a: 0, b: 1, c: 0 });
  });

  it('handles an empty selector list', () => {
    expect(computeSpecificity(':is()')).toEqual({ a: 0, b: 0, c: 0 });
  });

  it('sums a full descendant selector', () => {
    expect(computeSpecificity('#main .nav li a.link:hover')).toEqual({ a: 1, b: 3, c: 2 });
  });
});

describe('splitCompounds', () => {
  it('splits on descendant whitespace', () => {
    expect(splitCompounds('.a .b')).toEqual(['.a', '.b']);
  });

  it('splits on a tight child combinator', () => {
    expect(splitCompounds('.a>.b')).toEqual(['.a', '.b']);
  });

  it('splits on a spaced child combinator without empty parts', () => {
    expect(splitCompounds('.a > .b')).toEqual(['.a', '.b']);
  });

  it('handles sibling combinators', () => {
    expect(splitCompounds('.a + .b ~ .c')).toEqual(['.a', '.b', '.c']);
  });

  it('does not split whitespace inside an attribute value', () => {
    expect(splitCompounds('[title="a b"]')).toEqual(['[title="a b"]']);
  });

  it('does not split whitespace inside a pseudo-class argument', () => {
    expect(splitCompounds(':not(.a .b)')).toEqual([':not(.a .b)']);
  });

  it('ignores a trailing combinator', () => {
    expect(splitCompounds('.a >')).toEqual(['.a']);
  });
});
