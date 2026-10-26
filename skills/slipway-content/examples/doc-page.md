---
# Save as docs/install.md, then add it to the docs list in _data/navigation.yml.
title: Install
description: Add the theme to a GitHub Pages site in two lines of config.
layout: doc
permalink: /docs/install/
nav_order: 2
---

## Add the theme

Put these lines in `_config.yml`:

```yaml
remote_theme: arminazimi/slipway
plugins:
  - jekyll-remote-theme
```

## Check the site

Push the change. GitHub Pages builds the site and shows the log of each build.
