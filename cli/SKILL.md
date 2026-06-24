---
name: css-unused-finder
description: Use when the user wants to grade a stylesheet's fragility, find brittle CSS, or find dead/unused classes — "how fragile is this CSS", "score my stylesheet A–F", "which classes are unused", "fail CI when the CSS gets too brittle". A Node 18+ CLI that reads a CSS file and prints a fragility score + letter grade with findings grouped by severity, plus dead-class detection when given markup. Also exposes analyze() as a library.
---

# css-unused-finder

Reads a CSS file and prints a fragility **score (0–100) and letter grade (A–F)**, then every fragility finding — `!important`, ID selectors, deep nesting, overqualified/high-specificity selectors, magic `z-index`, duplicates — grouped by severity. Give it markup with `--html` and it also reports **dead classes** (defined in the CSS, never used in the markup). A `--min-grade` flag turns it into a CI gate that exits non-zero when a file is too brittle. The analysis engine is also importable as a typed module via `analyze()`.

## When to reach for this

User says:
- "how fragile / brittle is this stylesheet?"
- "give my CSS a grade / score the quality of styles.css"
- "which classes are defined but never used?" (pass `--html`)
- "I keep needing !important — what's making this CSS hard to override?"
- "fail CI if the stylesheet drops below a B"
- "analyze this CSS programmatically" (use the `analyze()` library export)

User does NOT mean this when they ask for:
- ❌ A full CSS linter (formatting, property typos, vendor prefixes) — point them at `stylelint`.
- ❌ Just the raw specificity heat map of every selector — that's `css-specificity-cli`.
- ❌ Autofixing or rewriting CSS — this tool reports and grades, it does not modify your CSS.
- ❌ Removing unused CSS from a built bundle by crawling a live app — this compares one stylesheet against markup you supply, it is not PurgeCSS.

## Install

```bash
pnpm add -g css-unused-finder        # global command
pnpm dlx css-unused-finder styles.css   # or run without installing
```

Node 18+. One arg-parser as the only runtime dep — the analysis engine is bundled in.

## Most common pattern (95% of cases)

```bash
# grade a stylesheet, findings grouped worst-first
css-unused-finder styles.css

# add dead-class detection by pointing at your rendered markup
css-unused-finder styles.css --html index.html

# fail CI when the file grades worse than a B
css-unused-finder styles.css --min-grade B

# grade several files at once
css-unused-finder base.css components.css utilities.css

# JSON for tooling / diffing
css-unused-finder styles.css --json
```

## Output (typical)

```
styles.css
  fragility  D  (64/100, 0 = rock solid → 100 = extremely fragile)

  High (2)
    #x .y .z .w
      `color` is marked !important — …
    #x .y .z .w
      ID selector (1,3,0) — …

  Medium (1)
    #x .y .z .w
      4 levels deep — …

  Low (1)
    #x .y .z .w
      z-index: 99999 is a magic number — …

  Dead classes (1)     ← only with --html
    .unused  — defined but never used in the markup

  3 rules · 3 selectors · 4 declarations
```

The grade/score banner is at the top; findings follow grouped **High → Medium → Low**. The score weights findings by severity against rule count, mapped to a grade: **A** ≤10, **B** ≤25, **C** ≤50, **D** ≤75, **F** >75.

## Flags

| Flag | What |
|---|---|
| `--html <file>` | read markup from `<file>` to enable dead-class detection |
| `-j, --json` | print the raw `AnalysisReport` JSON instead of the report |
| `--min-grade <A-F>` | CI gate: exit `1` if any file grades worse than this |
| `--no-color` | disable ANSI colors (respects `NO_COLOR` too) |

Exit codes: `0` ok · `1` `--min-grade` gate failed · `2` bad input (missing/unreadable CSS or `--html` file, invalid `--min-grade`).

## CI recipe

```yaml
# .github/workflows/ci.yml step
- run: pnpm dlx css-unused-finder src/styles.css --min-grade B
```

## Library API (same engine, no CLI)

```ts
import { analyze } from 'css-unused-finder';

const report = analyze({
  css: '#x .y{color:red!important}',
  markup: '<div class="y"></div>', // optional — enables dead-class detection
});

report.grade;          // 'F'
report.fragilityScore; // 0–100
report.findings;       // [{ kind, selector, message, severity }, …]
report.deadClasses;    // { definedClasses, usedClasses, unusedClasses, markupProvided }
```

`parseStylesheet`, `computeSpecificity`, `findDeadClasses`, `gradeFor`, and every report type are exported too.

## Gotchas

1. **Dead-class detection needs `--html`.** Without markup there's nothing to compare against, so the section is skipped and `deadClasses.markupProvided` is `false`.
2. **"Unused" means "not present in the markup string you gave it"** — it's a static defined-minus-referenced diff, not a runtime/render-time analysis. A class hidden by `display:none` but still in the HTML counts as *used*; a class only added by JS the tool never sees counts as *dead*. Point `--html` at fully rendered markup for the best signal.
3. **It grades and reports, it doesn't rewrite.** Use it to find offenders and watch the trend; fix them yourself.
4. **The grade is relative to rule count.** One `!important` in a 200-rule sheet barely moves the score; the same finding in a 3-rule sheet tanks it. That's intentional — fragility is about density.

## Links

- npm: https://www.npmjs.com/package/css-unused-finder
- landing: https://css-unused-finder-three.vercel.app
- repo: https://github.com/kea0811/css-unused-finder
