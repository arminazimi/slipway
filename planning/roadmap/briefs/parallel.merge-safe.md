## Problem

When several PRs are open at once (for example one agent per issue), almost every merge makes the others conflict on the same few shared files:

- `CHANGELOG.md`: each PR adds a line to the same `Unreleased` section.
- `package.json` and `package-lock.json`: each new tool adds its own script or dependency.
- `.github/workflows/ci.yml`: each new check adds a step.

GitHub's merge button ignores `.gitattributes` merge drivers (`merge=union`), so that cannot fix it, and a merge queue is a repository setting (maintainers only).

## Proposal

1. **Changelog fragments.** Each PR adds its own file, `changelog.d/<issue-or-pr>.md`, with one line. `tools/release/prepare.mjs <version>` collects the fragments into the dated section of `CHANGELOG.md` and deletes them. Update `CONTRIBUTING.md` and `AGENTS.md` ("Add a `CHANGELOG.md` line in any PR a site owner would notice" becomes "Add a fragment in `changelog.d/`").
2. **Auto-discovered checks.** `npm run check` runs every `tools/*/run.mjs` (and `tools/*/*.test.mjs`) it finds, so a new tool adds no script to `package.json`. Keep the skip-when-missing behavior of the existing optional tools (Playwright, Ruby, Seaworthy).
3. **CI.** Browser-based checks (`tools/browser`, `tools/a11y`, `tools/nojs`, `tools/screenshots`) run from one step that discovers them, instead of one workflow step each.
4. **Dev dependencies.** Group optional tool dependencies so adding one does not rewrite the same `package.json` lines (for example, one `devDependencies` block sorted alphabetically, which Git merges cleanly when entries are on different lines).

## Done when

- Two PRs that each add a changelog fragment and a new `tools/<name>/` check merge in either order with no conflict.
- `tools/release/prepare.mjs` has a test covering fragments (ordering, empty folder, a fragment with several lines).
- `npm run check` passes and still skips optional tools when their dependency is missing.
- `CONTRIBUTING.md` and `AGENTS.md` describe the new flow.

## Notes

- Touches only repository tooling and docs: no theme, spec, or adapter files.
- Do this after the currently open PRs (#378 to #385 and the ones Jules is still preparing) have merged, so it does not conflict with them.
