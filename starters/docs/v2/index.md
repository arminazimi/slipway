---
title: Nimbus 2
description: What version 2 changes and how to read this guide.
layout: doc
permalink: /v2/
---

Nimbus 2 keeps a folder of notes in sync with a remote store. It reads the files you already have, writes them back in place, and never renames them. The guide has three pages: this overview, [install](/v2/install.html), and the [command reference](/v2/cli.html).

## What changed in version 2

- One `nimbus sync` command replaces `nimbus push` and `nimbus pull` from version 1.
- `nimbus export` writes the remote store back to plain Markdown for backup.
- Settings live in `.nimbus.yml` at the root of the notes folder instead of the home directory.

## Getting started

1. [Install Nimbus](/v2/install.html) and sign in.
2. Point it at a folder: `nimbus sync ~/notes`.
3. Leave it running with `nimbus sync --watch`, or run it when you want.

## Upgrading from version 1

Run `nimbus sync` once in the folder you used with version 1. It converts `.nimbusrc` to `.nimbus.yml` and leaves a copy of the old file in place. The [version 1 guide](/v1/) stays online until the last release that supports it.
