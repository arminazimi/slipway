---
title: Nimbus 1
description: The version 1 guide, kept for reference.
layout: doc
permalink: /v1/
---

> **Nimbus 1 is no longer maintained.** This guide stays online for reference. Read the [version 2 guide](/v2/) for current releases.

Version 1 synced notes with two commands, `nimbus push` and `nimbus pull`. It read settings from `.nimbusrc` in your home directory, so it could sync only one folder per machine.

The guide has three pages: this overview, [install](/v1/install.html), and the [command reference](/v1/cli.html).

## What version 1 did

- `nimbus push` uploaded local changes.
- `nimbus pull` downloaded remote changes.
- `nimbus status` printed the last push and pull.

## Known limits

- One folder per machine, set in `.nimbusrc`.
- No watch mode; run the commands yourself or from a timer.
- No export command.

Version 2 removes all three limits and keeps the same plain-text files. See [what changed in version 2](/v2/).
