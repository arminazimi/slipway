## Goal
Cut the first release Evergreen pins.

## Steps
1. Run `node tools/release/prepare.mjs 0.2.0`, review `CHANGELOG.md` and `UPGRADING.md`, and merge.
2. Push the `v0.2.0` tag and check the release workflow created the GitHub release.
3. Build `examples/bare` with `remote_theme: arminazimi/slipway@v0.2.0`.

## Done when
- [ ] The `v0.2.0` tag and GitHub release exist.
- [ ] A site pinned to `@v0.2.0` builds on GitHub Pages.
