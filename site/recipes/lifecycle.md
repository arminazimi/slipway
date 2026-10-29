---
title: Keep dependencies alive with Evergreen
description: Run Evergreen on a Slipway site, read its findings, and pin versions.
layout: doc
permalink: /recipes/lifecycle/
date: 2024-03-20
author: Slipway
---

Your Slipway site relies on various dependencies: Ruby in `.ruby-version`, Node versions in CI workflows, GitHub Actions, gems, and npm packages. Over time, these dependencies can reach end-of-life (EOL) and become deprecated, which might break your build or leave your site vulnerable.

You can use [Evergreen](https://github.com/arminazimi/evergreen), a local-first deprecation scanner, to find deprecated and EOL dependencies in your project before they cause issues.

**Note:** Evergreen is entirely optional for Slipway sites. Your site builds, passes `slipway doctor`, and ships successfully without it.

## Running Evergreen {id="running-evergreen"}

Evergreen checks your `.ruby-version`, `.github/workflows/`, `Gemfile.lock`, and `package-lock.json` for any dependencies that are deprecated or out of date.

To run it locally via CLI, use:

```bash
npx @arminazimi/evergreen check
```

## Reading findings and pinning versions {id="reading-findings-and-pinning-versions"}

Evergreen will report on any EOL or deprecated dependencies, pointing to the exact file and line, offering a replacement, and providing migration steps.

For example, if an older Ruby version is specified in `.ruby-version`, Evergreen will flag it so you can upgrade. By reading its findings, you can pin your dependencies to supported, secure versions.

## Automating with GitHub Actions {id="automating-with-github-actions"}

You can also run Evergreen in your CI environment to catch issues on Pull Requests or via a weekly schedule.

Create a workflow file `.github/workflows/lifecycle.yml`:

```yaml
name: Dependency Lifecycle

on:
  pull_request:
  schedule:
    - cron: "0 0 * * 1" # Run weekly on Mondays

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Evergreen Check
        uses: arminazimi/evergreen/action/check@main
```

For more details on integrating Evergreen, read the [Evergreen documentation](https://github.com/arminazimi/evergreen).
