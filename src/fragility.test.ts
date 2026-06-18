import { describe, expect, it } from 'vitest';
import type { Finding, Rule } from './types';
import {
  containsUniversal,
  findDuplicateSelectors,
  findImportant,
  findMagicZIndex,
  findSelectorIssues,
  gradeFor,
  isOverqualified,
  scoreFragility,
} from './fragility';

function rule(selectors: string[], declarations: Rule['declarations'] = []): Rule {
  return { selectors, declarations, media: null };
}

function kinds(findings: Finding[]): string[] {
  return findings.map((f) => f.kind);
}

describe('findImportant', () => {
  it('flags an !important declaration', () => {
    const found = findImportant(
      rule(['.a'], [{ property: 'color', value: 'red', important: true }]),
    );
    expect(found).toHaveLength(1);
    expect(found[0].severity).toBe('high');
  });

  it('ignores ordinary declarations', () => {
    expect(
      findImportant(rule(['.a'], [{ property: 'color', value: 'red', important: false }])),
    ).toEqual([]);
  });
});

describe('findMagicZIndex', () => {
  it('flags a large z-index', () => {
    expect(
      findMagicZIndex(rule(['.a'], [{ property: 'z-index', value: '9999', important: false }])),
    ).toHaveLength(1);
  });

  it('flags a large negative z-index', () => {
    expect(
      findMagicZIndex(rule(['.a'], [{ property: 'z-index', value: '-1000', important: false }])),
    ).toHaveLength(1);
  });

  it('ignores a small z-index', () => {
    expect(
      findMagicZIndex(rule(['.a'], [{ property: 'z-index', value: '1', important: false }])),
    ).toEqual([]);
  });

  it('ignores a non-numeric z-index', () => {
    expect(
      findMagicZIndex(rule(['.a'], [{ property: 'z-index', value: 'auto', important: false }])),
    ).toEqual([]);
  });

  it('ignores other properties', () => {
    expect(
      findMagicZIndex(rule(['.a'], [{ property: 'color', value: 'red', important: false }])),
    ).toEqual([]);
  });
});

describe('containsUniversal', () => {
  it('is true for a bare universal', () => {
    expect(containsUniversal('*')).toBe(true);
  });

  it('is false when there is no star', () => {
    expect(containsUniversal('.a')).toBe(false);
  });

  it('ignores a star inside an attribute selector or string', () => {
    expect(containsUniversal('[class*="x"]')).toBe(false);
  });

  it('ignores a star inside a pseudo-class argument', () => {
    expect(containsUniversal(':not(*)')).toBe(false);
  });
});

describe('isOverqualified', () => {
  it.each([
    ['div.box', true],
    ['a#x', true],
    ['input[type]', true],
    ['.box', false],
    ['div', false],
    ['div:hover', false],
  ])('%s → %s', (selector, expected) => {
    expect(isOverqualified(selector)).toBe(expected);
  });
});

describe('findSelectorIssues', () => {
  it('flags deep descendant chains', () => {
    expect(kinds(findSelectorIssues('.a .b .c .d'))).toContain('deep-nesting');
  });

  it('does not flag shallow chains', () => {
    expect(kinds(findSelectorIssues('.a .b'))).not.toContain('deep-nesting');
  });

  it('flags overqualified selectors', () => {
    expect(kinds(findSelectorIssues('ul.nav'))).toContain('overqualified');
  });

  it('flags the universal selector', () => {
    expect(kinds(findSelectorIssues('.a *'))).toContain('universal');
  });

  it('flags ID selectors', () => {
    const found = findSelectorIssues('#main');
    expect(kinds(found)).toContain('id-selector');
    expect(kinds(found)).not.toContain('high-specificity');
  });

  it('flags high specificity when there is no ID', () => {
    expect(kinds(findSelectorIssues('.a.b.c.d'))).toContain('high-specificity');
  });

  it('leaves a clean, simple selector with no findings', () => {
    expect(findSelectorIssues('.a')).toEqual([]);
  });
});

describe('findDuplicateSelectors', () => {
  it('flags a selector declared twice', () => {
    const found = findDuplicateSelectors([rule(['.a']), rule(['.a'])]);
    expect(found).toHaveLength(1);
    expect(found[0].selector).toBe('.a');
  });

  it('treats whitespace-different selectors as the same', () => {
    expect(findDuplicateSelectors([rule(['.a  .b']), rule(['.a .b'])])).toHaveLength(1);
  });

  it('does not flag unique selectors', () => {
    expect(findDuplicateSelectors([rule(['.a']), rule(['.b'])])).toEqual([]);
  });
});

describe('scoreFragility', () => {
  const high: Finding = { kind: 'important', selector: '.a', message: '', severity: 'high' };

  it('is zero with no findings', () => {
    expect(scoreFragility([], 5)).toBe(0);
  });

  it('caps at 100 for a pile of severe findings', () => {
    expect(scoreFragility([high, high], 1)).toBe(100);
  });

  it('scales by rule count', () => {
    expect(scoreFragility([high], 6)).toBe(12);
  });

  it('treats an empty stylesheet as one rule to avoid divide-by-zero', () => {
    expect(scoreFragility([high], 0)).toBe(72);
  });
});

describe('gradeFor', () => {
  it.each([
    [0, 'A'],
    [10, 'A'],
    [25, 'B'],
    [50, 'C'],
    [75, 'D'],
    [76, 'F'],
  ])('%i → %s', (score, grade) => {
    expect(gradeFor(score)).toBe(grade);
  });
});
