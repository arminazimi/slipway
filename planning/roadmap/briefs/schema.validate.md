## Goal
CI step that validates every page's front matter and the config, with messages naming the file, key, and allowed values.

## Agent brief

**Context**
Builds on `schema.config` and `schema.front-matter`. This is also the engine that `slipway doctor` will call.

**Steps**
1. Add `tools/theme/validate.mjs <dir>` that validates `_config.yml` and every Markdown file under the site, printing `path:line key: message (allowed: ...)` and exiting 1 on errors.
2. Use `yaml`'s line counter to report the line of the key.
3. Add `npm run check:schemas` and include it in `npm run check`.
4. Document the output format in a code block in `tools/theme/README.md`.

**Files**
- `tools/theme/validate.mjs` and test
- `package.json`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not call the network; schemas are loaded from the repository.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `npm run check` fails on an invalid front-matter sample and passes on the examples.
- [ ] Each message has file, line, key, and allowed values.
- [ ] The function can be imported by another module (no top-level process exit).
