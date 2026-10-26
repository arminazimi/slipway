---
title: Deploy to Cloudflare Pages
description: How to deploy your Slipway site to Cloudflare Pages.
layout: doc
permalink: /recipes/cloudflare-pages/
date: 2024-03-20
author: Slipway
---

## Deploy to Cloudflare Pages

You can easily deploy a Slipway site to Cloudflare Pages.

### Prerequisites

Since Slipway uses the `remote_theme` feature of Jekyll by default, it requires the GitHub Pages gem. If you want to deploy to Cloudflare Pages, you'll need to set up a standard Jekyll build.

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

### Setup on Cloudflare Pages

1. Log in to the Cloudflare dashboard and go to "Pages".
2. Click "Create a project" and select "Connect to Git".
3. Connect your GitHub or GitLab account and select your repository.
4. Configure the build settings:
   - **Framework preset:** Jekyll
   - **Build command:** `bundle exec jekyll build`
   - **Build output directory:** `_site`
5. Click "Save and Deploy".

Cloudflare Pages will now build and deploy your site automatically whenever you push changes to your repository.
