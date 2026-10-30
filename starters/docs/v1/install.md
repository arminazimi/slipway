---
title: Install Nimbus 1
description: The version 1 install steps, kept for reference.
layout: doc
permalink: /v1/install.html
---

> **Nimbus 1 is no longer maintained.** This guide stays online for reference. Read the [version 2 guide](/v2/) for current releases.

Nimbus 1 needs Node 14 or later.

## Install

```sh
npm install --global @example/nimbus@1
nimbus --version
```

## Point it at a folder

Create `.nimbusrc` in your home directory and set the folder:

```yaml
folder: ~/notes
store: https://notes.example.org
```

## First push

```sh
nimbus push
```

Version 1 uploads the whole folder on the first push and only changed files after that. To bring changes down, run `nimbus pull`. Neither command watches the folder, so nothing happens until you run one of them.
