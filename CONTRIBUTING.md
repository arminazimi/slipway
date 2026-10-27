# Contributing to Slipway

Thanks for helping. Slipway is built from small, independent tasks, so you can contribute a useful piece in an hour.

## Find work

Every planned task is an issue generated from [ROADMAP.md](ROADMAP.md) and linked to its epic.

- **Lane** says who a task suits:
  - `lane: free-agent`: spec-complete. Good for newcomers and for free or lightweight coding agents.
  - `lane: strong-agent`: needs design judgment. Good for experienced contributors and strong coding agents.
  - `lane: maintainer`: needs accounts, credentials, or decisions. Maintainers only.
- **Size** says how big it is: `size: XS` (under an hour), `size: S` (a few hours), `size: M` (about a day).
- Pick a task whose dependencies (listed under **Depends on**) are closed. Tasks labeled `needs: seaworthy` also wait on a Seaworthy release.

## Claim it

Comment on the issue to claim it. If you go quiet for a week, someone else may pick it up; just comment again if you are still on it.

## Do it

1. Read [AGENTS.md](AGENTS.md).
2. Follow the issue's agent brief, if it has one. If not, comment with a short plan first.
3. Keep the PR to that one issue.
4. Add tests for what users or agents can observe.
5. Run `npm run check`.
6. Open the PR with `Closes #<issue>`.

For anything a site owner would notice, add a fragment: `changelog.d/<issue>.md` with one line (see [changelog.d/README.md](changelog.d/README.md)). Do not edit `CHANGELOG.md`, so parallel PRs never conflict.

A new check needs no wiring: `npm run check` runs every `tools/<name>/run.mjs` and every `*.test.mjs` it finds (`tools/check.mjs`), and CI runs the browser-based `run.mjs` tools in one step. Put an optional tool's dependency in `devDependencies` as one line in alphabetical order, and make `run.mjs` print `SKIP` and exit 0 when it is missing.

## Working in parallel

To avoid merge conflicts when working on tasks in parallel:
- Check `.github/hot-files.txt` before modifying any shared files. Stop and explain why in the PR if you need to edit a file not listed.
- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<issue-number>.md` with one line instead.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- Keep one file per check, tool, and language.

## Releasing

Maintainers only. Sites pin a release with `remote_theme: arminazimi/slipway@vX.Y.Z`.

1. On an up-to-date `main`, run `node tools/release/prepare.mjs X.Y.Z`. It bumps `slipway-theme.gemspec`, moves `Unreleased` and the `changelog.d/` fragments in `CHANGELOG.md` under `X.Y.Z` with today's date (and deletes the fragments), and prints the git commands.
2. Commit on a `release/vX.Y.Z` branch, open a pull request, and merge it once CI is green.
3. On `main`, tag the merge commit and push the tag: `git tag -a vX.Y.Z -m vX.Y.Z && git push origin vX.Y.Z`.
4. The [release workflow](.github/workflows/release.yml) fails if the tag does not match the gemspec version, runs `npm run check`, and creates the GitHub release with that `CHANGELOG.md` section as its notes.
5. Publishing the gem to RubyGems is a separate, manual step; no workflow does it.

## Proposing starters, blocks, and migrations

Open an issue that names who the starter or block is for, links two or three real sites it should be able to build, and lists what it needs from the core theme.

## Using agents

Agents are welcome contributors. The same rules apply: one issue per PR, `npm run check` passes, and a human or agent reviewer can follow what changed. Say in the PR which agent you used, if any.

On a bare cloud VM, run `bash tools/agents/setup.sh` first: it installs Node, Ruby, the Pages gem, and Playwright so `npm run check` runs in full (see `tools/agents/README.md`).
