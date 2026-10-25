## Goal
GitHub Action that runs `slipway doctor` on any static site, with pull request annotations.

## Agent brief

**Context**
Most sites check in CI. A composite Action that runs the doctor and turns findings into pull request annotations makes adoption one YAML block. `doctor.output` already writes SARIF and JSON.

**Steps**
1. Add `action/doctor/action.yml` (composite): inputs `path`, `build` (optional), `level` (default L1), `format`; it runs `node packages/doctor/bin/slipway.mjs doctor` from the action's own checkout.
2. Print each finding as a GitHub workflow command (`::error file=...,line=...::message`) so it shows on the pull request diff.
3. Optional input `sarif: true` writes `slipway.sarif` for `github/codeql-action/upload-sarif`.
4. Use the action in Slipway's own CI on `examples/docs`.
5. Document a five-line usage block in `action/doctor/README.md`.

**Files**
- `action/doctor/`
- `.github/workflows/ci.yml`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not publish to the Marketplace; that is a maintainer step.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] Slipway's CI runs the action and it passes.
- [ ] A test calls the annotation formatter and checks one line per finding with file and line.
- [ ] The README shows usage with and without SARIF.
