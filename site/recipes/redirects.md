---
title: Redirects
description: Keep old URLs working when pages move, with jekyll-redirect-from.
layout: doc
permalink: /recipes/redirects/
date: 2024-03-20
author: Slipway
---

## Keep old URLs working

When you move or rename a page, you can use the `jekyll-redirect-from` plugin to automatically redirect visitors from the old URL to the new one.

This plugin is supported in both **Classic mode** (GitHub Pages without a build step) and **Actions mode**.

### Configuration

If you are running outside of GitHub Pages (or to ensure it runs correctly locally), make sure the plugin is added to your `_config.yml`:

```yaml
plugins:
  - jekyll-redirect-from
```

### Usage

To set up a redirect, add the `redirect_from` array to the front matter of the **new** page (the destination you want visitors to end up at). Include all the old URLs that should redirect here.

For example, if you moved a page from `/old-url/` to this page, you would configure it like this:

```yaml
redirect_from:
  - /old-url/
  - /another-old-url/
```

For more details on how the redirects are generated, read the [official jekyll-redirect-from documentation](https://github.com/jekyll/jekyll-redirect-from).
