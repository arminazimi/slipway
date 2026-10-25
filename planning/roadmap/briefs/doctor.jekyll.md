## Goal
Jekyll and Slipway checks: required stubs, deprecated keys, no Liquid in content, translation pairs, UI strings.

## Agent brief

**Context**
Generator-specific checks live in a module of the doctor so other generators can add their own. These are the Jekyll and Slipway ones; they run only when `doctor.detect` says Jekyll.

**Steps**
1. Add `packages/doctor/src/checks/jekyll.mjs` exporting checks with stable ids (`jekyll.stubs`, `jekyll.deprecated`, `jekyll.liquid-in-content`, `jekyll.translation-pair`, `jekyll.ui-strings`).
2. Stubs: every file in `starter-files/` is present. Deprecated: reuse `tools/theme/deprecations.mjs`. Liquid in content: `{{` or `{%` in a Markdown body outside code. Translation pairs: every `translation_key` has a page in each language of `slipway.languages`. UI strings: every key in `_data/i18n/<lang>.yml` exists for each language.
3. Each finding has file, line, and a one-line fix.
4. Fixtures for each check, one passing and one failing.

**Files**
- `packages/doctor/src/checks/jekyll.mjs` and test
- `packages/doctor/test/fixtures/jekyll-*`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not repeat Seaworthy's checks (links, alt text, headings).

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] All five checks run on `examples/minimal` with no findings.
- [ ] Each failing fixture gives exactly one finding with file and line.
- [ ] Check ids are listed in the doctor's README.
