---
title: Overview
description: What Orbit does and what it needs on the server.
layout: doc
permalink: /docs/
---

## What Orbit does

Orbit copies a folder of built files to a server you control and keeps every copy as a release. The server serves a symlink that points at the current release.

## What you need

- A host you can reach over SSH, with `rsync` installed.
- A directory the SSH user can write to, such as `/srv/orbit`.
- Node 20 or later on your machine.

## Next

- [Install Orbit](/docs/install/)
- [Read the command reference](/docs/commands/)
