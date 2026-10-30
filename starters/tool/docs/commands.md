---
title: Commands
description: Every Orbit command, its flags, and what it exits with.
layout: doc
permalink: /docs/commands/
---

## `orbit deploy [dir]`

Uploads `dir` (the current folder by default) as a new release and points the server at it.

| Flag | What it does |
| --- | --- |
| `--dry-run` | Prints the files that would change and uploads nothing. |
| `--message <text>` | Labels the release, such as the commit subject. |
| `--keep <n>` | Keeps the last `n` releases on the server. Defaults to 5. |

Exit code `0` when the release is live, `1` when the upload fails, `2` when the configuration is missing.

## `orbit rollback`

Points the server at the release before the current one.

| Flag | What it does |
| --- | --- |
| `--to <release>` | Rolls back to a named release instead of the previous one. |

Exit code `0` on success, `1` when there is no release to return to.

## `orbit logs`

Streams the deploy log of the current release.

## `orbit status`

Prints the current release, its message, and when it went live.
