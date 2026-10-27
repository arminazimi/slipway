# Anchor Checker

Checks that TOC links, heading anchors, footnotes, and skip links point at IDs that exist exactly once on the page.

It runs on every `examples/*` site, light and dark, LTR and RTL. It skips with a notice when Playwright or Ruby is missing.

## Run

```bash
npm run check:tools
```

Or just this checker:

```bash
node tools/anchors/run.mjs
```
