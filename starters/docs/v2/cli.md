---
title: Commands
description: Every Nimbus 2 command and the options that matter.
layout: doc
permalink: /v2/cli.html
---

The command line is small on purpose: one command syncs, the rest inspect or export.

| Command | What it does |
| --- | --- |
| `nimbus sync <folder>` | Sync a notes folder with the store, in both directions. |
| `nimbus sync --watch` | Keep syncing in the background until you stop it. |
| `nimbus status` | Print the folder, the store, and the files waiting. |
| `nimbus export <folder>` | Write the store back to plain Markdown. |
| `nimbus login` | Sign in and store the token in the keychain. |
| `nimbus logout` | Forget the token on this machine. |

## Options

| Option | Applies to | Effect |
| --- | --- | --- |
| `--dry-run` | `sync`, `export` | Print what would change, write nothing. |
| `--verbose` | all | Print every file as it is read or written. |
| `--config <file>` | all | Read settings from a file other than `.nimbus.yml`. |

## Exit codes

- `0`: the command finished; nothing is waiting.
- `1`: the command failed; the message names the file.
- `2`: there are conflicts to resolve by hand.

Scripts that sync on a timer should treat `2` as a warning, not a failure: the next run picks up the resolved files.
