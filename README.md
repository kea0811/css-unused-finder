# css-unused-finder

> Paste a stylesheet, get an instant **fragility + dead-class report** — no build step, no upload, nothing leaves your browser.

![tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)
![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)
![license](https://img.shields.io/badge/license-MIT-blue.svg)

**🌐 [Live demo →](https://css-unused-finder.vercel.app)**

CSS rarely breaks because a rule is _wrong_ — it breaks because a rule is _fragile_. An
`!important` here, an ID selector there, a five-level descendant chain that assumes the markup
never moves. **css-unused-finder** reads any stylesheet and grades exactly that brittleness, then
(if you paste your markup too) tells you which classes nothing actually renders.

It's a single page. You paste, you read, you fix. The analysis runs locally in your browser — no
account, no upload, no waiting on a build.

## For AI coding agents

Drop [`SKILL.md`](./SKILL.md) into your AI editor / Claude Code workspace and it learns how to use
this tool — when to reach for it, the hosted URL, the stateless `/api/analyze` endpoint, and the
gotchas that are easy to miss.

## What it flags

| Signal | Why it's fragile |
| --- | --- |
| `!important` | Wins specificity battles and forces the next override to escalate too |
| ID selectors | Only another ID can beat them — reuse and theming get painful |
| Overqualified selectors | `ul.nav` welds a rule to one tag and adds needless specificity |
| Deep descendant chains | `.a .b .c .d` shatters the moment the markup is reshuffled |
| The universal selector | `*` matches everything — easy to write, hard to reason about |
| Runaway specificity | Stacks of classes/attributes that will be stubborn to override |
| Magic `z-index` | Values like `9999` usually paper over a real layering bug |
| Duplicate selectors | Scattered duplicates make cascade order load-bearing |

Each finding rolls up into a 0–100 **fragility score** and a familiar **A–F grade**.

### Dead-class detection

Paste your HTML or JSX alongside the CSS and every class that's defined but never rendered is
listed back to you. Detection is deliberately conservative: tokens from dynamic expressions
(`clsx(...)`, template strings) count as "used", so the tool never tells you to delete a class it
merely failed to understand.

## Try it

The fastest path is the hosted app — **[css-unused-finder.vercel.app](https://css-unused-finder.vercel.app)**.
Paste, hit **Load example** to see it in action, done.

## Use it from a script

There's a stateless JSON endpoint behind the same engine, handy for CI or a quick check:

```bash
curl -X POST https://css-unused-finder.vercel.app/api/analyze \
  -H 'content-type: application/json' \
  -d '{"css":".a{color:red!important} .ghost{}","markup":"<div class=\"a\"></div>"}'
```

```jsonc
{
  "stats": { "rules": 2, "selectors": 2, "declarations": 1 },
  "findings": [{ "kind": "important", "selector": ".a", "severity": "high", "message": "…" }],
  "fragilityScore": 72,
  "grade": "D",
  "deadClasses": { "unusedClasses": ["ghost"], "markupProvided": true, "...": "…" }
}
```

The request body is `{ css: string, markup?: string }`. Nothing is stored.

## Run it locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm test:coverage   # the analysis engine is covered 100%
pnpm build           # production build
```

The whole tool is a Next.js 15 App Router project. The analysis engine lives in [`src/`](./src) as
plain, dependency-free TypeScript — parser, specificity calculator, fragility rules and dead-class
detector — so it's just as easy to read as it is to run.

## How it works

A small hand-rolled CSS parser turns the stylesheet into rules and declarations (correctly skipping
strings, comments, `@keyframes` blocks and braces inside attribute values). A spec-aware
specificity calculator scores each selector — including `:is()` / `:where()` / `:not()` — and a set
of heuristic rules surface the fragile patterns. Everything is pure functions, which is why the
engine ships at 100% test coverage.

## Caveats

- It's a **heuristic** linter, not a build-time coverage tool — it sees the CSS and markup you give
  it, not your whole app at runtime.
- Dynamic class names (computed strings, CSS-in-JS) are treated as used, by design.
- Escaped class names like Tailwind's `.w-1\/2` are read up to the escape — a known limitation.

## Contributing

Issues and PRs are welcome. Keep the `src/` engine at 100% coverage (`pnpm test:coverage`) and
TypeScript strict — those are the only hard rules.

## License

MIT © 2026 kea0811
