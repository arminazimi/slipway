---
title: Deploy to Codeberg Pages
description: How to build and deploy your Slipway site using Codeberg Pages.
layout: doc
permalink: /recipes/codeberg-pages/
date: 2024-03-20
author: Slipway
---

## Deploy to Codeberg Pages

You can build and deploy a Slipway site to Codeberg Pages using Forgejo Actions or Woodpecker CI.

Slipway relies on Jekyll, so you will build your site and push the output to the `pages` branch. This means Codeberg Pages will run in **Actions mode**. You will not use Codeberg's built-in Jekyll support (which only supports safe plugins).

### Prerequisites

Since you will be running the build yourself, you must use standard Jekyll instead of `remote_theme`.

1. Ensure your `Gemfile` includes the theme:
   ```ruby
   source "https://rubygems.org"
   gem "jekyll"
   gem "slipway-theme"
   ```

2. In your `_config.yml`, use `theme` instead of `remote_theme`:
   ```yaml
   theme: slipway-theme
   ```

### Setup with Forgejo Actions

Codeberg supports Forgejo Actions. You can create a workflow file at `.forgejo/workflows/pages.yml` (or `.gitea/workflows/pages.yml`) to build your site and push it to the `pages` branch.

Please refer to the [Codeberg Pages documentation](https://docs.codeberg.org/codeberg-pages/) for details on how to set up the deployment step.

### Setup with Woodpecker CI

Codeberg also supports Woodpecker CI. You can create a pipeline file at `.woodpecker.yml` to build the site and deploy it.

See the [Codeberg Pages Woodpecker documentation](https://docs.codeberg.org/ci/woodpecker/) and the [Woodpecker Jekyll plugin](https://woodpecker-ci.org/plugins/Jekyll) for details.
