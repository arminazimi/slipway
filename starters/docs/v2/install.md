---
title: Install Nimbus 2
description: Requirements, the install command, and the first sync.
layout: doc
permalink: /v2/install.html
---

Nimbus 2 needs Node 20 or later and a folder of notes you can write to.

## Install

```sh
npm install --global @example/nimbus
nimbus --version
```

## Sign in

```sh
nimbus login
```

The command opens the store in your browser and waits for the token. When it finishes, the token is stored in your system keychain, not in a file in the notes folder.

## First sync

```sh
nimbus sync ~/notes
```

The first run uploads every file in the folder. Later runs send only what changed, in both directions. Add `--watch` to keep it running in the background; the [command reference](/v2/cli.html) lists the options.

## Check the setup

```sh
nimbus status
```

`nimbus status` prints the folder, the remote store, and the number of files waiting to sync. If it reports a conflict, keep both files: Nimbus never deletes a note to resolve one.
