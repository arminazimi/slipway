## Goal
`UPGRADING.md` and a CI test that builds the previous release's examples with the current theme.

## Agent brief

**Context**
A minor release must not break a site that worked on the previous one. After `standalone.release` there are tags; this test builds the examples from the last tag with the theme from the working tree.

**Steps**
1. Add `tools/release/upgrade-test.mjs`: find the latest `v*` tag with `git describe --tags --abbrev=0`, export its `examples/` with `git archive` into a temp folder, and build each with the current theme in gem mode.
2. Fail on a build error or on a new Liquid warning; print deprecation warnings without failing.
3. Skip with a notice when there is no tag yet, and run it in CI only (fetch tags with `fetch-depth: 0`).
4. Write `UPGRADING.md`: one section per minor release with what changed for sites and the exact edit to make; start with `0.2.0`.

**Files**
- `tools/release/upgrade-test.mjs` and test
- `UPGRADING.md`
- `.github/workflows/ci.yml`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not change or delete tags.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] CI builds the previous release's examples with the current theme.
- [ ] Removing a public include in a test branch makes the check fail with the file name.
- [ ] `UPGRADING.md` exists and is linked from `README.md` and `CHANGELOG.md`.
