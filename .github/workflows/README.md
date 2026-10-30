# Workflows

GitHub Actions for this repository. [AGENTS.md](../../AGENTS.md) lists the commands the required one runs.

| Workflow | Runs on | What it does | Required |
|---|---|---|---|
| [`ci.yml`](ci.yml) | push to `main`, every pull request, every merge queue batch | `check (pages)` runs `npm run check` and the upgrade test on the GitHub Pages gem; `check (jekyll4)` builds and checks every example on plain Jekyll 4; `browser tests` runs the Playwright tools | yes |
| [`deploy-site.yml`](deploy-site.yml) | push to `main` | builds the Slipway site and the spec site, then deploys them to GitHub Pages | no |
| [`lifecycle.yml`](lifecycle.yml) | every pull request, Mondays 04:17 UTC | Evergreen scan of runtimes, gems, npm packages, and actions; report-only, so findings never fail the build | no |
| [`release.yml`](release.yml) | a `v*` tag | checks the tag against the gemspec, runs `npm run check`, creates the GitHub release, then publishes the gem to RubyGems | no |
| `stats.yml` | never | empty file, to be removed by the `ci.repo-hygiene` task | no |

## Merge queue

The merge queue waits for the checks that `main` requires of a pull request, and it tests a batch on a temporary `gh-readonly-queue/main/...` branch. A workflow whose checks gate merges therefore needs `merge_group:` under `on:`, or its checks never start and every queued pull request waits forever. Only `ci.yml` gates merges today, so it is the only one with the trigger.

The checks it waits for come from `ci.yml`'s jobs, the only ones that gate a merge:

- `check (pages)`
- `check (jekyll4)`
- `browser tests`

`ci.split` (#670) folds those jobs behind a single `ci-ok` job, and `ci.merge-queue-on` requires `ci-ok` and turns the queue on. `main` has no required status checks yet, so until that maintainer step lands the queue waits for nothing; the required list is a repository setting, not a workflow change.

## Adding a workflow

Give each concern its own file, so parallel changes do not conflict in `ci.yml`. A new workflow is not required unless `main`'s branch protection requires one of its checks; requirable checks must also be reported on `merge_group` (use `on: [pull_request, merge_group]` or list both), and the queue waits for them on the batch branch too.
