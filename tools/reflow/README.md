# Reflow Checker

This tool enforces the WCAG 1.4.10 Reflow requirement at 320 CSS pixels wide (and implicitly 400% zoom of 1280px).

It launches Playwright on the generated example sites and sets the viewport to 320px wide. It then analyzes every page to ensure no element extends beyond the viewport horizontally, which would trigger a document-level horizontal scroll.

Elements deliberately designed to scroll horizontally—such as code blocks (`<pre>`) and wide tables within a wrapper (`.sl-table-wrapper` or `.sl-compare-table-wrapper`)—are ignored as long as they are properly configured with `overflow-x: auto` or `overflow-x: scroll`.

To run this tool standalone:
```bash
node tools/reflow/run.mjs
```

It is also run as part of the overarching test suite:
```bash
npm run check
```
