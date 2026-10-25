## Goal
"Edit with your agent" on every section: copies a prompt with the source file, line, and current text.

## Agent brief

**Context**
Slipway's second signature. Each section gets a small control that copies a prompt an agent can act on: the source file, the line, and the current text. It needs line-level maps (`sourcemap.lines`), so it works only where those exist; elsewhere it falls back to the page's file.

**Steps**
1. In the doc and post layouts, give each `h2` and `h3` section a `data-source` attribute with `path:line` from `sourcemap.json` (Actions mode) or `path` only (classic).
2. Add `assets/js/edit-prompt.js` (deferred, under 1.2 KB): a button, `hidden` until the script runs, copies `Edit <path>:<line>. Current text: <section text>. Change: ` to the clipboard.
3. Put the prompt template in `_data/i18n/` so it is translated, and make the button label right in RTL.
4. Add the script to the JavaScript budget and keep the total under 10 KB.
5. Test: the built doc page has `data-source` on every section, and a unit test of the prompt builder with a Persian section.

**Files**
- `_layouts/doc.html`, `_layouts/post.html`
- `assets/js/edit-prompt.js`
- `_includes/i18n-builtin.html`
- a new `tools/theme/edit-prompt.test.mjs`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not show the button without JavaScript; the page must read the same without it.
- Do not send the prompt anywhere; copy only.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] Every section of a doc page in Actions mode has a working button that copies file, line, and text.
- [ ] `npm run check:js` passes.
- [ ] With JavaScript off, no button is visible.
