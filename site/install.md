---
title: Install and quickstart
description: Get started with Slipway in three ways.
layout: doc
---

## Install

You can install Slipway in three ways:

### 1. Remote theme (Zero config)

The fastest way is to use Slipway as a `remote_theme` on GitHub Pages. Create a `_config.yml` with:

```yaml
theme: slipway-theme
plugins:
  - jekyll-remote-theme
```

### 2. Gem

If you have a Ruby environment, you can install Slipway as a gem. Add to your `Gemfile`:

```ruby
gem "slipway-theme"
```

And to your `_config.yml`:

```yaml
theme: slipway-theme
```

### 3. Template

You can use the repo as a template to get all the starter files, allowing you to edit the theme files directly if needed.
