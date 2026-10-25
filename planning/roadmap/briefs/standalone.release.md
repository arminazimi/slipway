## Goal
Release workflow: version bump, `CHANGELOG.md`, tag, and GitHub release, so `remote_theme: arminazimi/slipway@v0.2.0` pins a version.

## Agent brief

**Context**
Sites pin a tag in `remote_theme`. There is no release process yet. The gem is published by a separate maintainer task (`standalone.gem-publish`), so this workflow must not publish packages.

**Steps**
1. Add `CHANGELOG.md` in Keep a Changelog style, with an `Unreleased` section and the history so far.
2. Add `.github/workflows/release.yml`: triggered by pushing a tag `v*`; checks that the tag matches the version in `slipway-theme.gemspec`; runs `npm run check`; creates a GitHub release whose notes are the matching `CHANGELOG.md` section.
3. Add `tools/release/prepare.mjs` (`node tools/release/prepare.mjs 0.2.0`): bumps the gemspec, moves `Unreleased` to the new version with today's date, and prints the git commands. Test it with a temp copy of the files.
4. Document the steps in `CONTRIBUTING.md` under 'Releasing'.

**Files**
- `.github/workflows/release.yml`
- `tools/release/`
- `CHANGELOG.md`
- `slipway-theme.gemspec`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Never push a tag or publish to RubyGems from the workflow or from a task run; the maintainer does that.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `prepare.mjs` bumps the version and the changelog and has tests.
- [ ] The workflow fails when the tag and the gemspec version differ.
- [ ] `CONTRIBUTING.md` explains the release in five steps or fewer.
