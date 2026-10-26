---
title: Analytics
description: How to add analytics to your Slipway site.
layout: doc
permalink: /recipes/analytics/
date: 2024-03-20
author: Slipway
---

## Adding analytics

To add analytics to your Slipway site, you can include the tracking code provided by your analytics service in the head of your pages.

Slipway currently doesn't have a built-in config option for analytics in the `_config.yml` to keep things simple, but you can inject the code using overrides.

1. Create a `_includes/head-custom.html` file in your repository.
2. Paste your analytics tracking code inside this file.
3. The theme will automatically include this file in the `<head>` of every page.

Example for Google Analytics:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XXXXXXXXXX');
</script>
```
