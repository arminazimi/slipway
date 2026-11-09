# slipway setup Action

Installs Node and the [engine](../../packages/engine/README.md)'s dependencies, and puts `slipway` on the `PATH`, so later steps in the job run it directly. It installs once per job and caches the npm download cache between jobs.

```yaml
- uses: actions/checkout@v4
- uses: arminazimi/slipway/action/setup@main
- run: slipway build . --out dist
- run: slipway check .
```

Use it before any step that runs the engine, for example a script in your own workflow. It never runs `npm` in your site's folder and never touches the site's `package.json`.

The Action installs Node and the engine only: it needs no Ruby, Bundler, or Jekyll. The [doctor Action](../doctor/README.md) installs the doctor's own dependencies, in its own copy of the checkout.

## Inputs

| Input | Default | Meaning |
| --- | --- | --- |
| `node-version` | `24` | The Node version installed with `actions/setup-node`. The engine needs 24 or later. |
| `cache` | `true` | Cache the npm download cache between jobs. Set to `false` to skip it. |
| `path` | `.` | The Slipway checkout that holds `packages/engine`, relative to the repository root. When the folder has no Slipway checkout, the Action uses its own copy. |

The Action has no outputs. It writes the shim folder to `$GITHUB_PATH`, so only later steps see `slipway`; the step that uses this Action cannot call it.

## What it does

1. Finds the Slipway checkout: `path` when it holds `packages/engine`, otherwise the Action's own downloaded copy. It resolves a native absolute path once, so the shims and the cache key work from any folder and on Windows.
2. Installs Node with `actions/setup-node`. With `cache: true` (the default), that also restores the npm download cache before the install and saves it after the job.
3. Runs `npm ci --omit=dev --ignore-scripts --no-audit --no-fund` in the Slipway checkout, only when `node_modules/preact` or `node_modules/remark-parse` is missing. A second `slipway setup` in the same job reuses the first install.
4. Writes two shims to `$RUNNER_TEMP/slipway-bin`, adds that folder to `$GITHUB_PATH`, and runs `slipway` through the checkout's `packages/engine/bin/slipway.ts`:
   - `slipway`, a `#!/bin/sh` script, for bash on Ubuntu, macOS, and Windows (Git Bash).
   - `slipway.cmd`, for `cmd.exe` and PowerShell on Windows, where `PATHEXT` picks it up.

`npm ci` uses the lockfile, so the install is reproducible and the engine's dependencies come from the same versions the repository tests against.

## Caching

`actions/setup-node` caches the npm download cache, the folder `npm config get cache` reports: `~/.npm` on Ubuntu and macOS, `%LocalAppData%\npm-cache` on Windows. The key includes the resolved checkout's `package-lock.json` plus the runner's OS and architecture, so a job with the same Slipway version and runner restores the cache instead of downloading the packages again. npm checks each package's integrity, so a stale cache only costs time, never a wrong install. Set `cache: false` when the job already restores the same cache, or when the runner has no cache service.

## Requirements

- A checkout of this repository, either the caller's (`actions/checkout` while working in this repository) or the copy GitHub downloads for `uses: arminazimi/slipway/action/setup@main`. Without the second, pass `path` to a checkout that holds `packages/engine`.
- Network access on the first run of a job, for `npm ci` (or a matching cache).
- Ubuntu, macOS, or Windows. The `run` steps use `bash`, which every GitHub-hosted runner provides.
