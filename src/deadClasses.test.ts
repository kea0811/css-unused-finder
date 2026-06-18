import { describe, expect, it } from 'vitest';
import type { Rule } from './types';
import {
  extractClassesFromMarkup,
  extractClassesFromSelector,
  extractDefinedClasses,
  findDeadClasses,
} from './deadClasses';

function rule(selectors: string[]): Rule {
  return { selectors, declarations: [], media: null };
}

describe('extractClassesFromSelector', () => {
  it('pulls multiple classes from a compound', () => {
    expect(extractClassesFromSelector('.a.b')).toEqual(['a', 'b']);
  });

  it('stops a class name at a pseudo-class', () => {
    expect(extractClassesFromSelector('.foo:hover')).toEqual(['foo']);
  });

  it('does not read a dot inside an attribute selector', () => {
    expect(extractClassesFromSelector('[data-x=".bar"]')).toEqual([]);
  });

  it('skips a stray top-level string', () => {
    expect(extractClassesFromSelector('"x" .c')).toEqual(['c']);
  });

  it('ignores a dot with no following name', () => {
    expect(extractClassesFromSelector('.')).toEqual([]);
  });
});

describe('extractDefinedClasses', () => {
  it('de-duplicates and sorts', () => {
    expect(extractDefinedClasses([rule(['.b', '.a']), rule(['.a'])])).toEqual(['a', 'b']);
  });
});

describe('extractClassesFromMarkup', () => {
  it('reads a double-quoted class attribute', () => {
    expect([...extractClassesFromMarkup('<div class="a b">')]).toEqual(['a', 'b']);
  });

  it('reads a single-quoted class attribute', () => {
    expect([...extractClassesFromMarkup("<i class='c'>")]).toEqual(['c']);
  });

  it('reads tokens out of a JSX className expression', () => {
    const used = extractClassesFromMarkup("<div className={clsx('foo', x && 'bar')} />");
    expect(used.has('foo')).toBe(true);
    expect(used.has('bar')).toBe(true);
  });

  it('drops empty tokens from leading whitespace', () => {
    expect([...extractClassesFromMarkup('<div class=" a">')]).toEqual(['a']);
  });
});

describe('findDeadClasses', () => {
  const rules = [rule(['.a']), rule(['.b']), rule(['.c'])];

  it('skips detection when markup is undefined', () => {
    const report = findDeadClasses(rules);
    expect(report.markupProvided).toBe(false);
    expect(report.definedClasses).toEqual(['a', 'b', 'c']);
    expect(report.unusedClasses).toEqual([]);
  });

  it('skips detection when markup is blank', () => {
    expect(findDeadClasses(rules, '   ').markupProvided).toBe(false);
  });

  it('splits defined classes into used and unused', () => {
    const report = findDeadClasses(rules, '<div class="a"></div>');
    expect(report.markupProvided).toBe(true);
    expect(report.usedClasses).toEqual(['a']);
    expect(report.unusedClasses).toEqual(['b', 'c']);
  });
});
