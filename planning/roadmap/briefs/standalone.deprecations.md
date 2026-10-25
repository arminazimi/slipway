## Goal
Build-time warnings for renamed config keys and front-matter fields, naming the replacement.

## Agent brief

**Context**
ADR 0012 (`standalone.public-api`) promises that a renamed config key or front-matter field keeps working for one minor release and warns with its replacement. Classic Pages runs no plugins, so the warning cannot be Ruby; it must come from the build check and from Liquid.

**Steps**
1. Add `schema/deprecations.json` (with its own JSON Schema): entries `{ kind: config|front-matter, old, new, since, removed_in }`.
2. In the layouts, read the new key and fall back to the old one for each entry (one small include, `_includes/compat.html`, keeps this in one place).
3. Add `tools/theme/deprecations.mjs <dir>` that scans `_config.yml` and front matter and prints `path:line old is deprecated since X, use new` without failing; `doctor.jekyll` will call it later.
4. Run it in `npm run check` on the examples, and test it with one fixture per kind.

**Files**
- `schema/deprecations.json`, `schema/deprecations.schema.json`
- `_includes/compat.html`
- `tools/theme/deprecations.mjs` and test

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not rename any real key in this task; the fixtures use a made-up one.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] A fixture site using an old key builds, looks the same as with the new key, and gets one warning naming the replacement.
- [ ] The warning has file and line.
- [ ] The function can be imported (no top-level process exit).
