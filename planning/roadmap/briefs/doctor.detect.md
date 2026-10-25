## Goal
Detect the generator (Jekyll, Hugo, Astro, Docusaurus, MkDocs, Eleventy) and its source and output folders.

## Agent brief

**Context**
The doctor needs to know where content lives and where output goes without being told. Detection uses marker files only.

**Steps**
1. Add `packages/doctor/src/detect.mjs` returning `{ generator, sourceDir, outputDir, confidence }`.
2. Markers: `_config.yml` + `Gemfile` or `_layouts` (Jekyll, output `_site`), `hugo.toml|yaml|json` or `config.toml` with `baseURL` (Hugo, `public`), `astro.config.*` (Astro, `dist`), `docusaurus.config.*` (Docusaurus, `build`), `mkdocs.yml` (MkDocs, `site`), `.eleventy.js|eleventy.config.*` (Eleventy, `_site`).
3. Unknown generator returns `generator: "unknown"` and the doctor still runs the generator-neutral tests.
4. One tiny fixture per generator under `packages/doctor/test/fixtures/` and a test table.

**Files**
- `packages/doctor/src/detect.mjs` and test
- fixtures

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not run any generator's build.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] Each of the six fixtures is detected with the right folders.
- [ ] A folder with two markers reports the stronger one with lower confidence.
- [ ] An empty folder returns `unknown` without throwing.
