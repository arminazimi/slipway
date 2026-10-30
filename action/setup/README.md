# slipway setup Action

Installs Node, the [`slipway doctor`](../../packages/doctor/README.md)'s two dependencies, and puts `slipway` on the `PATH`, so later steps in the job run it directly. It installs once per job and caches the npm download cache between jobs.

```yaml
- uses: actions/checkout@v4
- uses: arminazimi/slipway/action/setup@main
- run: slipway doctor . --build _site
```

Use it before any step that runs `slipway`, for example the [doctor Action](../doctor/README.md) or a script in your own workflow. It never runs `npm` in your site's folder and never touches the site's `package.json`.

## Inputs

| Input | Default | Meaning |
| --- | --- | --- |
| `node-version` | `22` | The Node version installed with `actions/setup-node`. The doctor needs 22 or later. |
| `cache` | `true` | Cache the npm download cache between jobs. Set to `false` to skip it. |
| `path` | `.` | The Slipway checkout that holds `packages/doctor`, relative to the repository root. When the folder has no Slipway checkout, the Action uses its own copy. |

The Action has no outputs. It writes the shim folder to `$GITHUB_PATH`, so only later steps see `slipway`; the step that uses this Action cannot call it.

## What it does

1. Finds the Slipway checkout: `path` when it holds `packages/doctor`, otherwise the Action's own downloaded copy. It resolves a native absolute path once, so the shims and the cache key work from any folder and on Windows.
2. Installs Node with `actions/setup-node`. With `cache: true` (the default), that also restores the npm download cache before the install and saves it after the job.
3. Runs `npm ci --omit=dev --ignore-scripts --no-audit --no-fund` in the Slipway checkout, only when `node_modules/ajv` or `node_modules/yaml` is missing. A second `slipway setup` in the same job reuses the first install.
4. Writes two shims to `$RUNNER_TEMP/slipway-bin`, adds that folder to `$GITHUB_PATH`, and runs `slipway` through the checkout's `packages/doctor/bin/slipway.mjs`:
   - `slipway`, a `#!/bin/sh` script, for bash on Ubuntu, macOS, and Windows (Git Bash).
   - `slipway.cmd`, for `cmd.exe` and PowerShell on Windows, where `PATHEXT` picks it up.

`npm ci` uses the lockfile, so the install is reproducible and the two dependencies come from the same versions the repository tests against.

## Caching

`actions/setup-node` caches the npm download cache, the folder `npm config get cache` reports: `~/.npm` on Ubuntu and macOS, `%LocalAppData%\npm-cache` on Windows. The key includes the resolved checkout's `package-lock.json` plus the runner's OS and architecture, so a job with the same Slipway version and runner restores the cache instead of downloading the packages again. npm checks each package's integrity, so a stale cache only costs time, never a wrong install. Set `cache: false` when the job already restores the same cache, or when the runner has no cache service.

## Requirements

- A checkout of this repository, either the caller's (`actions/checkout` while working in this repository) or the copy GitHub downloads for `uses: arminazimi/slipway/action/setup@main`. Without the second, pass `path` to a checkout that holds `packages/doctor`.
- Network access on the first run of a job, for `npm ci` (or a matching cache).
- Ubuntu, macOS, or Windows. The `run` steps use `bash`, which every GitHub-hosted runner provides.
