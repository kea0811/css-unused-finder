# css-unused-finder

![tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)
![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

**🌐 [Live demo →](https://css-unused-finder.vercel.app)**

> Grade a stylesheet's fragility A–F and see exactly what makes it brittle — the `!important` chasers, the ID selectors, the four-levels-deep chains, and the classes nothing renders.

CSS rarely breaks loudly. It rots: an `!important` here, an `#id` override there, a selector nested so deep that reshuffling one `<div>` shatters it. By the time it hurts, the fragility is everywhere and invisible. `css-unused-finder` makes it legible — point it at a file and it prints a single fragility **score and letter grade** up top, then every finding grouped by severity, then (when you hand it your markup) the classes that are defined but never used. Add `--min-grade` and it becomes a CI gate that fails the build when the stylesheet slips below the bar.

No config, no rules to tune, no stylesheet rewriting. Just the grade and the reasons behind it.

## For AI coding agents

Drop [`SKILL.md`](./SKILL.md) into your AI editor / Claude Code workspace and it learns how to use this tool — when to reach for it, the install + canonical command, the flags, and the gotchas that are easy to miss.

## Install

```bash
pnpm add -g css-unused-finder
```

> Using npm or yarn? `npm install -g css-unused-finder` / `yarn global add css-unused-finder` work too. Or skip the install entirely with `pnpm dlx css-unused-finder styles.css` (`npx css-unused-finder styles.css` works the same way). Bleeding edge or before the first npm release: `pnpm add -g github:kea0811/css-unused-finder`.

Requires Node 18+.

## Quick start

Point it at a stylesheet:

```bash
css-unused-finder styles.css
```

```text
styles.css
  fragility  D  (64/100, 0 = rock solid → 100 = extremely fragile)

  High (2)
    #x .y .z .w
      `color` is marked !important — that wins specificity battles and forces the next override to escalate too.
    #x .y .z .w
      ID selector (1,3,0) — only another ID can override it, so reuse and theming get painful.

  Medium (1)
    #x .y .z .w
      4 levels deep — long descendant chains shatter the moment the markup is reshuffled.

  Low (1)
    #x .y .z .w
      z-index: 99999 is a magic number — large stacking values usually paper over a layering bug.

  3 rules · 3 selectors · 4 declarations
```

The grade and score sit at the top, then findings are grouped worst-first (**High → Medium → Low**), each showing the offending selector and a one-line reason. The footer counts what was parsed.

### Find dead classes

Hand it your rendered markup with `--html` and it adds a **Dead classes** section — every class the stylesheet defines that never appears in the HTML/JSX you pointed it at:

```bash
css-unused-finder styles.css --html index.html
```

```text
  …
  Dead classes (4)
    .unused  — defined but never used in the markup
    .w  — defined but never used in the markup
    .y  — defined but never used in the markup
    .z  — defined but never used in the markup
```

Without `--html`, dead-class detection is skipped — there's nothing to compare the stylesheet against. When every defined class is accounted for, you get a green all-clear instead.

### Analyze several files at once

```bash
css-unused-finder base.css components.css utilities.css
```

Each file gets its own graded section. With `--min-grade`, the gate fails if *any* of them slips below the bar.

### Gate it in CI

```bash
css-unused-finder styles.css --min-grade B
```

If the file grades worse than `B` (a `C`, `D`, or `F`), `css-unused-finder` prints a red `✗` line to stderr and exits `1` — so it fails your pipeline instead of letting fragility quietly climb. When it meets or beats the bar, it exits `0`.

### Machine-readable output

```bash
css-unused-finder styles.css --json
```

```json
{
  "stats": { "rules": 3, "selectors": 3, "declarations": 4 },
  "findings": [
    {
      "kind": "important",
      "selector": "#x .y .z .w",
      "message": "`color` is marked !important — …",
      "severity": "high"
    }
  ],
  "fragilityScore": 64,
  "grade": "D",
  "deadClasses": {
    "definedClasses": ["a", "unused", "w", "y", "z"],
    "usedClasses": [],
    "unusedClasses": [],
    "markupProvided": false
  }
}
```

Pipe it into `jq`, store it as a build artifact, or diff two runs to watch fragility drift over time. Passing more than one file yields a JSON array, each entry tagged with its `file`.

## Options

| Flag | Description |
| --- | --- |
| `--html <file>` | Read markup from `<file>` to enable dead-class detection. |
| `-j, --json` | Print the raw `AnalysisReport` as JSON instead of a report. |
| `--min-grade <A-F>` | CI gate: exit `1` if any file grades worse than this. |
| `--no-color` | Disable ANSI colors (also respects the `NO_COLOR` env var). |
| `-v, --version` | Print the version. |
| `-h, --help` | Show usage and examples. |

Exit codes: `0` success · `1` the `--min-grade` gate failed · `2` a usage or I/O error (missing/unreadable file).

## What gets flagged

| Finding | Severity | Why it's fragile |
| --- | --- | --- |
| `!important` | high | Wins specificity battles and forces the next override to escalate too. |
| ID selector | high | Only another ID can override it — reuse and theming get painful. |
| Deep nesting (4+ levels) | medium | Long descendant chains break the moment the markup is reshuffled. |
| Overqualified (e.g. `ul.nav`) | medium | The tag name locks the rule to one element and adds needless specificity. |
| High specificity (4+ classes) | medium | The rule becomes stubborn to override later. |
| Universal `*` | low | Matches every element — easy to write, hard to reason about. |
| Magic `z-index` (≥ 1000) | low | Large stacking values usually paper over a layering bug. |
| Duplicate selector | low | Scattered duplicates make the cascade order load-bearing. |

The fragility score weights findings by severity against the rule count, then maps onto a letter grade: **A** (≤ 10) · **B** (≤ 25) · **C** (≤ 50) · **D** (≤ 75) · **F** (> 75).

## Programmatic API

The same analysis engine ships as a typed ESM/CJS module, so you can grade stylesheets inside your own scripts:

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

Every helper the CLI uses — `parseStylesheet`, `computeSpecificity`, `findDeadClasses`, `gradeFor`, and the full set of report types — is exported too.

## Live demo

See it in action at **[css-unused-finder.vercel.app](https://css-unused-finder.vercel.app)** — a static page with a sample run.

## Contributing

PRs welcome — especially more fragility heuristics and markup-extraction edge cases. To hack on it:

```bash
pnpm install
pnpm test
pnpm build
```

`pnpm test:coverage` enforces 100% coverage, and `pnpm dev` rebuilds on change.

## License

MIT © [kea0811](https://github.com/kea0811)
