---
title: Deploy to Vercel
description: How to deploy your Slipway site to Vercel.
layout: doc
permalink: /recipes/vercel/
date: 2024-03-20
author: Slipway
---

## Deploy to Vercel

You can easily deploy a Slipway site to Vercel. Since Vercel runs a build step outside GitHub Pages, this deployment falls under [Actions mode](/docs/modes/).

### Prerequisites

Since Slipway uses the `remote_theme` feature of Jekyll by default, deploying to Vercel requires setting up a standard Jekyll build.

1. Create a `Gemfile` in your repository:
   ```ruby
   source "https://rubygems.org"
   gem "jekyll"
   gem "slipway-theme"
   ```

2. In your `_config.yml`, use `theme` instead of `remote_theme`:
   ```yaml
   theme: slipway-theme
   ```

3. Ensure you have a `.ruby-version` file at the root of your project specifying the Ruby version (e.g., `3.3.0`), as Vercel requires it to install dependencies correctly.

### Setup on Vercel

For full instructions, refer to the [official Vercel Jekyll documentation](https://vercel.com/docs/frameworks/jekyll).

When configuring your project on Vercel, use the following settings:
- **Framework Preset:** Jekyll
- **Build Command:** `bundle exec jekyll build`
- **Output Directory:** `_site`

### Markdown Twins Headers

To ensure that the Markdown twins are served with the correct `Content-Type`, create a `vercel.json` file in the root of your repository with the following headers configuration:

```json
{
  "headers": [
    {
      "source": "/(.*)\\.md",
      "headers": [
        {
          "key": "Content-Type",
          "value": "text/markdown; charset=utf-8"
        }
      ]
    }
  ]
}
```
