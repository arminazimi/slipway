## Goal
One example proves a product's documentation site works on Slipway: pages without front matter linked with relative `.md` links, a generated reference section, a static dashboard, its own `llms.txt` and `sitemap.xml`, and a project-site `baseurl`.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `examples/product-docs/` (`_config.yml` with `remote_theme` and `defaults` that give every page `layout: doc`, about 10 hand-written pages, `_data/navigation.yml`)
- `examples/product-docs/reference/` (30 pages written by `examples/product-docs/generate.mjs`, which has a `--check` mode)
- `examples/product-docs/dashboard/`, `examples/product-docs/llms.txt`, `examples/product-docs/sitemap.xml`

## Steps
1. Run `npm run twins -- examples/product-docs` and `npm run sourcemap -- examples/product-docs` and commit their output.
2. Make sure every check that builds `examples/*` (site, axe, HTML validation, no-JS, screenshots) passes on it; fix the example, not the checks.

## Done when
- [ ] `npm run check` builds and checks `examples/product-docs` with zero findings.
- [ ] `node examples/product-docs/generate.mjs --check` passes.
- [ ] `npm run check` passes.

## Working in parallel
- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Do not edit `package.json`, `package-lock.json`, `.github/workflows/`, `.gitignore`, `ROADMAP.md`, `AGENTS.md`, `_layouts/base.html`, `_includes/head.html`, or `assets/css/slipway.css`. `npm run check` finds new `tools/<name>/run.mjs` and `*.test.mjs` files on its own.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
