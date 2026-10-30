---
title: Commands
description: The version 1 commands, kept for reference.
layout: doc
permalink: /v1/cli.html
---

> **Nimbus 1 is no longer maintained.** This guide stays online for reference. Read the [version 2 guide](/v2/) for current releases.

Version 1 has three commands. There is no `sync`, no watch mode, and no export.

| Command | What it does |
| --- | --- |
| `nimbus push [--dry-run]` | Upload local changes to the store. |
| `nimbus pull [--dry-run]` | Download remote changes into the folder. |
| `nimbus status` | Print the folder, the store, and the last push and pull. |

## Exit codes

- `0`: the command finished.
- `1`: the command failed; the message names the file.
- `2`: there are conflicts to resolve by hand.

Run `nimbus push` before `nimbus pull` when both sides changed, and keep both copies when a conflict is reported. The files are plain Markdown, so nothing is lost as long as you do not delete either version.
