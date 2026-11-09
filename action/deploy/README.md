# slipway deploy Action

Installs Node, builds a site with [`slipway build`](../../packages/engine/README.md), runs `slipway check`, optionally runs [`slipway doctor`](../../packages/doctor/README.md), and deploys the output to GitHub Pages with the official Pages actions.

```yaml
name: deploy

on:
  push:
    branches: [main]

permissions: {}

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - id: deploy
        uses: arminazimi/slipway/action/deploy@main
        with:
          path: .
          doctor: "true"
```

The Action deploys in the job that runs it, so the job needs `pages: write` and `id-token: write`, and the `github-pages` environment. The official template splits build and deploy into two jobs; here one Action does both so a site needs one step. The Action always deploys: do not call it on `pull_request`, where a job cannot deploy. Build pull requests with the engine directly instead.

## Inputs

| Input | Default | Meaning |
| --- | --- | --- |
| `path` | `.` | The site's source folder, relative to the repository root. |
| `node-version` | `24` | The Node version `actions/setup-node` installs. The engine needs 24 or later. |
| `doctor` | `false` | Run `slipway doctor` on the built site before uploading. The step fails when any MUST in the agent-editable spec fails. |

Outputs: `page_url`, the address of the deployed site.

## What it does

1. Finds the Slipway checkout beside the Action (`action/deploy/../..`), whether the caller checked it out (`uses: ./action/deploy`) or GitHub downloaded it (`uses: arminazimi/slipway/action/deploy@main`). It resolves a native absolute path once, so the cache key and the engine's paths work from any folder and on Windows.
2. Installs Node with `actions/setup-node`, caching the npm download cache on the checkout's `package-lock.json`.
3. Runs `npm ci --omit=dev --ignore-scripts --no-audit --no-fund` in that checkout, only when the engine's dependencies are missing. It never runs `npm` in the site's folder and never touches the site's `package.json`.
4. Builds the site with the engine's CLI (`packages/engine/bin/slipway.ts build`) into `$RUNNER_TEMP/slipway-site`, so no build output lands in the repository.
5. Runs the engine's `check` command on the source. It builds to its own temporary folder, prints the diagnostics, and fails the step on an error.
6. Runs `slipway doctor <path> --build $SLIPWAY_OUT` when `doctor` is `true`. With no `--level`, the doctor fails when any MUST in the agent-editable spec fails.
7. Runs `actions/configure-pages`, so a repository without Pages fails before the upload rather than after it.
8. Uploads the output with `actions/upload-pages-artifact` and deploys it with `actions/deploy-pages`.

## Base path

A project site is served under `/<repository>`, and the engine takes that path from `base` in `slipway.yml`; it has no command-line override. Set it there before the first deploy:

```yaml
base: /my-repository
```

The Action does not rewrite URLs, so `base` and the repository name must agree. A user or organization site at the domain root keeps the default, `base: ""`.

## Doctor

The doctor reads the built output, so it runs after the build and gets `--build` for free. It reports the level the site reaches in the agent-editable spec; set `doctor: "false"` (the default) while the site does not reach at least L1, or fix the findings. The Action installs the doctor's dependencies in its own checkout, not in the site's.

## Requirements

- A checkout of this repository, either the caller's (`actions/checkout` while working in this repository) or the copy GitHub downloads for `uses: arminazimi/slipway/action/deploy@main`.
- Network access on the first run of a job, for `npm ci` (or a matching npm cache).
- `pages: write` and `id-token: write` on the job, and the `github-pages` environment.
- Ubuntu, macOS, or Windows. The `run` steps use `bash`, which every GitHub-hosted runner provides.

## Pinned actions

Every third-party action is pinned to a commit SHA, with its version in a comment on the same line: `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`. Dependabot updates the pins and the comments (`.github/dependabot.yml`, `github-actions`).
