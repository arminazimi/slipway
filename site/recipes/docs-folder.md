---
title: Documentation from a docs/ folder
description: Host a documentation site in your code repository's docs/ folder.
layout: doc
permalink: /recipes/docs-folder/
date: 2024-03-20
author: Slipway
---

You can host a Slipway site alongside your code in the same repository by putting it in a `docs/` folder. This is a common setup for project documentation.

This recipe works in **Classic mode** using GitHub Pages.

## Configure GitHub Pages {id="configure-github-pages"}

1. Go to your repository's settings on GitHub.
2. In the "Pages" section, set the source to "Deploy from a branch" (Classic mode).
3. Select your default branch and choose the `/docs` folder instead of `/ (root)`.
4. Save the settings.

For more details, see the [official GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Configure your Slipway site {id="configure-your-slipway-site"}

In your `docs/_config.yml`, add the `source_dir` setting under the `slipway` key so that the "Edit with your agent" button knows the site lives in the `docs/` folder.

```yaml
slipway:
  source_dir: docs
```

## Verify in CI {id="verify-in-ci"}

To ensure your documentation meets quality standards, you can run the `slipway doctor` on your `docs/` folder in your project's continuous integration.

Create or update a GitHub Actions workflow file (e.g. `.github/workflows/docs.yml`):

```yaml
name: Docs

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Slipway Doctor
        uses: arminazimi/slipway/action/doctor@main
        with:
          path: docs
```
