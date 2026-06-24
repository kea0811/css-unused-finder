---
name: css-unused-finder
description: Use when a user wants to audit a CSS stylesheet for fragility (!important, ID selectors, runaway specificity, deep nesting, magic z-index, duplicates) or find dead/unused class names — a hosted, stateless browser tool plus a POST /api/analyze JSON endpoint. No install, no Node version requirement; works against any CSS string.
---

# css-unused-finder

A hosted tool that grades how *fragile* a stylesheet is and finds classes nothing renders. Reach
for it when someone hands you CSS and asks "is this brittle?", "what's safe to delete?", or "why is
this so hard to override?" — instead of eyeballing the file, run it through the analyzer or call the
endpoint and reason from the structured report.

## When to reach for this

User says:
- "Audit / review this CSS for code smells or fragility"
- "Which of these classes are unused / dead?"
- "Why does this stylesheet keep needing `!important` to override?"
- "Grade the quality of this CSS"

User does NOT mean this when they ask for:
- ❌ Build-time tree-shaking of unused CSS across a whole project (point them at PurgeCSS / the
  Tailwind content pipeline — this is a paste-one-stylesheet heuristic, not a bundler plugin)
- ❌ Autoprefixing, minifying, or formatting CSS (use PostCSS / Prettier)
- ❌ Validating CSS syntax against the spec (use stylelint)

## Use it

**Hosted app:** https://css-unused-finder-three.vercel.app — paste CSS (and optionally HTML/JSX), read
the grade + findings + dead classes. Everything runs client-side.

**Stateless API (for scripts / CI):**

```bash
curl -X POST https://css-unused-finder-three.vercel.app/api/analyze \
  -H 'content-type: application/json' \
  -d '{"css":".a{color:red!important}","markup":"<div class=\"a\"></div>"}'
```

Request body: `{ css: string, markup?: string }`. Without `markup`, dead-class detection is skipped
and only the fragility report comes back. Nothing is stored.

## Report shape

| Field | What it is |
| --- | --- |
| `stats` | `{ rules, selectors, declarations }` counts |
| `findings[]` | `{ kind, selector, message, severity }` — one per fragility signal |
| `fragilityScore` | 0 (rock solid) → 100 (very fragile) |
| `grade` | `A`–`F`, derived from the score |
| `deadClasses` | `{ definedClasses, usedClasses, unusedClasses, markupProvided }` |

`finding.kind` is one of: `important`, `id-selector`, `overqualified`, `deep-nesting`, `universal`,
`high-specificity`, `magic-zindex`, `duplicate-selector`. `severity` is `low` \| `medium` \| `high`.

## Gotchas worth knowing

1. **Dead classes need markup.** With no `markup`, `unusedClasses` is empty and `markupProvided` is
   `false` — that's "not checked", not "nothing is dead".
2. **Dynamic class names count as used.** Tokens inside `clsx(...)`, template literals, or any
   `className={...}` expression are treated as used on purpose, so it never tells you to delete a
   class it just couldn't parse. It can therefore *under*-report dead classes, never over-report.
3. **Escaped class names** (e.g. Tailwind's `.w-1\/2`) are read only up to the backslash.
4. It's a **heuristic** — a guide for refactoring, not a guarantee the CSS is unused at runtime.

## Links

- Live tool: https://css-unused-finder-three.vercel.app
- API: `POST https://css-unused-finder-three.vercel.app/api/analyze`
- Repo: https://github.com/kea0811/css-unused-finder
