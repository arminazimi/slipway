---
title: Deploy to Netlify
description: How to deploy your Slipway site to Netlify.
layout: doc
permalink: /recipes/netlify/
date: 2024-03-20
author: Slipway
---

## Deploy to Netlify

You can easily deploy a Slipway site to Netlify.

### Prerequisites

Since Slipway uses the `remote_theme` feature of Jekyll by default, it requires the GitHub Pages gem. If you want to deploy to Netlify, you'll need to set up a standard Jekyll build.

1. Ensure you have a `Gemfile` in your repository:
   ```ruby
   source "https://rubygems.org"
   gem "jekyll"
   gem "slipway-theme"
   ```

2. In your `_config.yml`, use `theme` instead of `remote_theme`:
   ```yaml
   theme: slipway-theme
   ```

### Setup on Netlify

1. Go to the Netlify dashboard and click "Add new site" > "Import an existing project".
2. Connect to your Git provider (GitHub, GitLab, or Bitbucket).
3. Select your repository.
4. Configure the build settings:
   - **Build command:** `bundle exec jekyll build`
   - **Publish directory:** `_site`
5. Click "Deploy site".

Netlify will now build and deploy your site automatically whenever you push changes to your repository.
