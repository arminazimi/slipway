## Goal
Give every epic the same realistic input: about 600 pages shaped like Evergreen's site, and a small right-to-left site.

## Files

**Create**
- `fixtures/README.md`
- `fixtures/docs-site/`
- `fixtures/docs-site/generate.mjs`
- `fixtures/rtl-site/`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Copy the hand-written pages of `examples/product-docs` (install, quickstart, configuration, reference, FAQ) into `fixtures/docs-site/` with a `slipway.yml`.
2. Some pages have no front matter and start with an `h1`, like Evergreen's.
3. `generate.mjs` writes about 500 generated rule pages under `rules/` deterministically (fixed seed) and is run once; its output is committed.
4. Include `_data/navigation.yml` with groups, a large `rules` section matched by prefix, an app page folder (`dashboard/`) with its own HTML, CSS, and JavaScript, and a site-owned `llms.txt`.
5. Every Markdown construct the components support appears at least once: code fences with titles and line marks, tabs, callouts, tables, steps, file trees.
6. `fixtures/rtl-site/`: five Persian pages with mixed Persian and English, code blocks, and numbers.
7. `fixtures/README.md`: fixtures are read-only; a task that needs new content adds a new fixture folder instead.

## Done when
- [ ] `fixtures/docs-site` has between 550 and 650 pages.
- [ ] Running `generate.mjs` twice gives no diff.
- [ ] `npm run check` passes.
