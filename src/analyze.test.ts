import { describe, expect, it } from 'vitest';
import { analyze } from './analyze';

describe('analyze', () => {
  it('reports stats, findings and a grade for a fragile stylesheet', () => {
    const report = analyze({
      css: `
        #header .nav ul li a { color: red !important; }
        .a, .b { z-index: 9999; }
        .a { color: blue; }
      `,
    });

    expect(report.stats.rules).toBe(3);
    expect(report.stats.selectors).toBe(4);
    expect(report.stats.declarations).toBe(3);

    const kinds = new Set(report.findings.map((f) => f.kind));
    expect(kinds.has('important')).toBe(true);
    expect(kinds.has('id-selector')).toBe(true);
    expect(kinds.has('deep-nesting')).toBe(true);
    expect(kinds.has('magic-zindex')).toBe(true);
    expect(kinds.has('duplicate-selector')).toBe(true);

    expect(report.fragilityScore).toBeGreaterThan(0);
    expect(['C', 'D', 'F']).toContain(report.grade);
  });

  it('detects dead classes when markup is supplied', () => {
    const report = analyze({
      css: '.used { color: red } .ghost { color: blue }',
      markup: '<div class="used"></div>',
    });
    expect(report.deadClasses.markupProvided).toBe(true);
    expect(report.deadClasses.unusedClasses).toEqual(['ghost']);
  });

  it('gives a clean stylesheet a top grade and skips dead-class detection', () => {
    const report = analyze({ css: '.btn { color: red } .card { padding: 1rem }' });
    expect(report.grade).toBe('A');
    expect(report.fragilityScore).toBe(0);
    expect(report.deadClasses.markupProvided).toBe(false);
  });
});
