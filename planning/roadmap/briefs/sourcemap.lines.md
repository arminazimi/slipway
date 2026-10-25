## Goal
Section-to-line map in Actions mode, through a small Jekyll plugin.

## Agent brief

**Context**
ADR 0007 levels 1 and 2: walk kramdown's parse tree for exact lines and the same heading ids as the HTML. Actions mode only; classic Pages cannot run plugins. The spike script is described in the ADR.

**Steps**
1. Create `_plugins/slipway_sourcemap.rb` (a `Jekyll::Generator`, `priority :lowest`) that, for each Markdown document, parses the body with kramdown 2.4.0, walks headings, links and code blocks, adds the front-matter line offset, and writes `sourcemap.json` with `"mode": "actions"`.
2. Handle setext headings, duplicate titles (`-1` suffix), ZWNJ in Persian headings, and `#` inside code fences, each with a fixture document.
3. Add `npm run sourcemap` (`tools/sourcemap/run.mjs`) that runs the same Ruby code outside Jekyll for classic-Pages sites and fails when the committed file is stale (level 1).
4. Tests: a fixture post with a broken link on a known line must map to that line; run them in `npm run check` when Ruby is present.

**Files**
- `_plugins/slipway_sourcemap.rb`
- `tools/sourcemap/`
- `tools/theme/fixtures/`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not use network access or change the Gemfile's Pages-pinned versions.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] Headings, links, and code blocks get exact lines in all five fixture cases.
- [ ] Ids match the built HTML.
- [ ] The output validates against `schema/sourcemap.schema.json`.
