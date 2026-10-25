## Goal
`npx slipway doctor <dir>`: check a source folder and its built output against the spec, for any generator.

## Agent brief

**Context**
This is the checker. It runs on Node 22 with no Ruby. It reads the source folder, optionally a built output folder, loads `spec/agent-editable/tests.json`, and prints the level reached.

**Steps**
1. Create the package `packages/doctor/` with `bin/slipway.mjs` and `src/` (ES modules, no runtime dependencies except `yaml` and `ajv`).
2. Implement `slipway doctor <dir> [--build <dir>] [--format text|json]`: run each test from `tests.json`, collect findings, compute the highest level whose tests all pass.
3. Reuse `tools/theme/validate.mjs` logic for schemas by moving it into the package; keep the old path as a thin re-export.
4. Exit codes: 0 all required tests of the target level pass (`--level`), 1 findings, 2 usage error.
5. Tests with three fixtures: a conforming site, a site missing `AGENTS.md`, a site with invalid front matter.

**Files**
- `packages/doctor/`
- `tools/theme/validate.mjs` (re-export)
- `package.json` (workspaces)

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not add a check that needs the network.
- Do not special-case Jekyll here; generator checks live in `doctor.jekyll`.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `node packages/doctor/bin/slipway.mjs doctor examples/docs` prints a level and findings.
- [ ] The fixtures give the expected levels.
- [ ] Package has a `bin` entry so `npx slipway doctor` works once published.
