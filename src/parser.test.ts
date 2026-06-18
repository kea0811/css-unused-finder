import { describe, expect, it } from 'vitest';
import {
  atRuleName,
  isNestedAtRule,
  parseDeclarations,
  parseStylesheet,
  splitTopLevel,
  stripComments,
} from './parser';

describe('atRuleName / isNestedAtRule', () => {
  it('extracts the keyword', () => {
    expect(atRuleName('@media (max-width: 600px)')).toBe('media');
  });

  it('returns an empty name when there is no keyword', () => {
    expect(atRuleName('@123')).toBe('');
  });

  it('recognises nested at-rules', () => {
    expect(isNestedAtRule('@supports (display: grid)')).toBe(true);
    expect(isNestedAtRule('@font-face')).toBe(false);
  });
});

describe('stripComments', () => {
  it('removes a comment', () => {
    expect(stripComments('a/*b*/c')).toBe('ac');
  });

  it('keeps comment-like sequences inside strings', () => {
    expect(stripComments('content:"/* keep */"')).toBe('content:"/* keep */"');
  });

  it('handles a lone star inside a comment', () => {
    expect(stripComments('/*a*b*/c')).toBe('c');
  });

  it('consumes an unterminated comment to the end', () => {
    expect(stripComments('a/*bc')).toBe('a');
  });

  it('leaves a solitary slash alone', () => {
    expect(stripComments('a/b')).toBe('a/b');
  });
});

describe('splitTopLevel', () => {
  it('splits on a top-level separator', () => {
    expect(splitTopLevel('.a, .b', ',')).toEqual(['.a', ' .b']);
  });

  it('ignores separators inside parentheses', () => {
    expect(splitTopLevel(':not(.a, .b)', ',')).toEqual([':not(.a, .b)']);
  });

  it('ignores separators inside strings', () => {
    expect(splitTopLevel('[x="a,b"]', ',')).toEqual(['[x="a,b"]']);
  });

  it('tracks bracket depth alongside top-level commas', () => {
    expect(splitTopLevel('a[b],c', ',')).toEqual(['a[b]', 'c']);
  });
});

describe('parseDeclarations', () => {
  it('parses property/value pairs', () => {
    expect(parseDeclarations('color: red; margin: 0')).toEqual([
      { property: 'color', value: 'red', important: false },
      { property: 'margin', value: '0', important: false },
    ]);
  });

  it('skips empty segments from a trailing semicolon', () => {
    expect(parseDeclarations('color:red;')).toEqual([
      { property: 'color', value: 'red', important: false },
    ]);
  });

  it('skips a segment with no colon', () => {
    expect(parseDeclarations('garbage')).toEqual([]);
  });

  it('skips a segment with an empty property', () => {
    expect(parseDeclarations(':red')).toEqual([]);
  });

  it('detects !important and trims it off the value', () => {
    expect(parseDeclarations('color: red !important')).toEqual([
      { property: 'color', value: 'red', important: true },
    ]);
  });

  it('detects !important case-insensitively with odd spacing', () => {
    expect(parseDeclarations('color:red ! IMPORTANT')).toEqual([
      { property: 'color', value: 'red', important: true },
    ]);
  });
});

describe('parseStylesheet', () => {
  it('parses a top-level rule with a null media context', () => {
    expect(parseStylesheet('.a { color: red }')).toEqual([
      {
        selectors: ['.a'],
        declarations: [{ property: 'color', value: 'red', important: false }],
        media: null,
      },
    ]);
  });

  it('splits multiple selectors', () => {
    expect(parseStylesheet('.a, .b { color: red }')[0].selectors).toEqual(['.a', '.b']);
  });

  it('carries the media prelude into nested rules', () => {
    const rules = parseStylesheet('@media (max-width: 600px) { .a { color: red } }');
    expect(rules).toHaveLength(1);
    expect(rules[0].media).toBe('@media (max-width: 600px)');
  });

  it('ignores statement at-rules like @import', () => {
    expect(parseStylesheet('@import "reset.css"; .a { color: red }')).toHaveLength(1);
  });

  it('skips declaration-only at-rules such as @keyframes', () => {
    const rules = parseStylesheet('@keyframes spin { 0% {} 100% {} } .a { color: red }');
    expect(rules).toHaveLength(1);
    expect(rules[0].selectors).toEqual(['.a']);
  });

  it('does not treat a brace inside a string as a block boundary', () => {
    const rules = parseStylesheet('[data-x="{"] { color: red }');
    expect(rules[0].selectors).toEqual(['[data-x="{"]']);
  });

  it('keeps a brace inside a declaration value', () => {
    const rules = parseStylesheet('.a { content: "}" }');
    expect(rules[0].declarations).toEqual([
      { property: 'content', value: '"}"', important: false },
    ]);
  });

  it('tolerates a stray closing brace with no open block', () => {
    const rules = parseStylesheet('} .a { color: red }');
    expect(rules).toHaveLength(1);
    expect(rules[0].selectors).toEqual(['.a']);
  });

  it('recovers a rule whose declaration block is never closed', () => {
    const rules = parseStylesheet('.a { color: red');
    expect(rules).toHaveLength(1);
    expect(rules[0].declarations).toEqual([
      { property: 'color', value: 'red', important: false },
    ]);
  });

  it('does not let a brace inside a skipped block leak out of a string', () => {
    const rules = parseStylesheet('@font-face { font-family: "A}B" } .a { color: red }');
    expect(rules).toHaveLength(1);
    expect(rules[0].selectors).toEqual(['.a']);
  });

  it('tolerates an unterminated skipped at-rule block', () => {
    expect(parseStylesheet('@keyframes x { 0% {')).toEqual([]);
  });
});
