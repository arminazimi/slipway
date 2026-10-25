## Goal
Documented override slots (`head-custom.html`, `footer-custom.html`, `assets/css/custom.css`), no fork needed.

## Agent brief

**Context**
A site that wants an analytics snippet, an extra footer link, or a colour tweak has to fork the theme today. Jekyll lets a site shadow any include, but shadowing `head.html` copies the whole file and breaks on upgrade. Empty, documented slots fix that.

**Steps**
1. Add empty `_includes/head-custom.html` and `_includes/footer-custom.html` and include them at the end of `head.html` and `footer.html`.
2. Link `assets/css/custom.css` after `slipway.css` only when the file exists in the site (check `site.static_files`), so no request 404s.
3. Add the three slots to the examples' docs and use `head-custom.html` in `examples/docs` for one harmless meta tag, as a proof.
4. Test: a template-mode build of `examples/docs` shows the meta tag; a build without `custom.css` has no link to it.
5. List the slots in `docs/overrides.md` and link it from `README.md`.

**Files**
- `_includes/head-custom.html`, `_includes/footer-custom.html`
- `_includes/head.html`, `_includes/footer.html`
- `docs/overrides.md`
- a new `tools/theme/overrides.test.mjs`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not add more slots than the three named; others need an ADR under `standalone.public-api`.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] The three slots work in gem and template mode.
- [ ] No page links to `custom.css` unless the site has one.
- [ ] `docs/overrides.md` shows a two-line example for each slot.
