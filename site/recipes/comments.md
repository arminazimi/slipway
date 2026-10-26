---
title: Comments
description: How to add comments to your Slipway site.
layout: doc
permalink: /recipes/comments/
date: 2024-03-20
author: Slipway
---

## Adding comments

To add comments to your pages, you can inject a comments widget like Giscus, utterances, or Disqus using the custom includes feature.

1. Create a `_includes/footer-custom.html` file in your repository.
2. Paste the snippet provided by your comments system inside this file.
3. The theme will append this file to the bottom of the content area.

Example using [Giscus](https://giscus.app/):

```html
<div class="giscus"></div>
<script src="https://giscus.app/client.js"
        data-repo="[ENTER REPO HERE]"
        data-repo-id="[ENTER REPO ID HERE]"
        data-category="[ENTER CATEGORY NAME HERE]"
        data-category-id="[ENTER CATEGORY ID HERE]"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="en"
        crossorigin="anonymous"
        async>
</script>
```
