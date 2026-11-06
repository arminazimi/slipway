# Workflows

GitHub Actions for this repository. [AGENTS.md](../../AGENTS.md) lists the commands the required one runs.

| Workflow | Runs on | What it does | Required |
|---|---|---|---|
| [`ci.yml`](ci.yml) | push to `main`, every pull request, every merge queue batch | `check (pages)` runs `npm run check` and the upgrade test on the GitHub Pages gem; `check (jekyll4)` builds and checks every example on plain Jekyll 4; `browser tests` runs the Playwright tools; `ci-ok` passes only when all of them did | yes |
| [`deploy-site.yml`](deploy-site.yml) | push to `main` | builds the Slipway site and the spec site, then deploys them to GitHub Pages | no |
| [`lifecycle.yml`](lifecycle.yml) | every pull request, Mondays 04:17 UTC | Evergreen scan of runtimes, gems, npm packages, and actions; report-only, so findings never fail the build | no |
| [`release.yml`](release.yml) | a `v*` tag | checks the tag against the gemspec, runs `npm run check`, creates the GitHub release, then publishes the gem to RubyGems | no |
| [`actions-os.yml`](actions-os.yml) | pull requests touching `action/` | runs the doctor Action on Linux, macOS, and Windows | no |
| [`codeql.yml`](codeql.yml) | push, pull request, weekly | CodeQL scan of the JavaScript and TypeScript | no |
| [`dependency-review.yml`](dependency-review.yml) | pull requests changing a manifest or lock file | fails on a vulnerable or unlicensed new dependency | no |
| [`ops-ci-feedback.yml`](ops-ci-feedback.yml) | a failed `ci` run | comments the failing step's log on an agent's pull request | no |
| [`ops-overlap.yml`](ops-overlap.yml) | pull request events | comments the files shared with other open pull requests | no |
| [`ops-progress.yml`](ops-progress.yml) | a task closes | keeps its epic's progress line current | no |
| [`ops-ready.yml`](ops-ready.yml) | an issue closes, hourly | keeps the `status: ready` label true | no |
| [`ops-update.yml`](ops-update.yml) | `main` moves | updates behind, conflict-free agent pull requests | no |
| [`ops-weekly.yml`](ops-weekly.yml) | Mondays | opens the weekly pipeline report issue | no |
| [`pages-doctor.yml`](pages-doctor.yml) | changes under `site/` | builds the site and runs the doctor at L3 | no |
| [`pages-lighthouse.yml`](pages-lighthouse.yml) | after a deploy | Lighthouse budgets for the deployed site | no |
| [`pages-live.yml`](pages-live.yml) | nightly | checks the deployed site and its links | no |
| [`scorecard.yml`](scorecard.yml) | push to `main`, weekly | OpenSSF Scorecard | no |
| [`secrets.yml`](secrets.yml) | pull requests, push, weekly | gitleaks secret scan | no |
| [`workflow-lint.yml`](workflow-lint.yml) | workflow or action changes | actionlint and zizmor | no |

## Merge queue

The merge queue waits for the checks that `main` requires of a pull request, and it tests a batch on a temporary `gh-readonly-queue/main/...` branch. A workflow whose checks gate merges therefore needs `merge_group:` under `on:`, or its checks never start and every queued pull request waits forever. Only `ci.yml` gates merges today, so it is the only one with the trigger.

`ci.yml`'s jobs are the only ones that gate a merge, and `ci-ok` needs all of them:

- `check (pages)`
- `check (jekyll4)`
- `browser tests`

`ci-ok` folds those jobs behind a single check: it runs even when a job it needs failed, and fails unless all succeeded. `ci.merge-queue-on` requires `ci-ok` and turns the queue on. `main` has no required status checks yet, so until that maintainer step lands the queue waits for nothing; the required list is a repository setting, not a workflow change.

## Adding a workflow

Give each concern its own file, so parallel changes do not conflict in `ci.yml`. A new workflow is not required unless `main`'s branch protection requires one of its checks; requirable checks must also be reported on `merge_group` (use `on: [pull_request, merge_group]` or list both), and the queue waits for them on the batch branch too.
