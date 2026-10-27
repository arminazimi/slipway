---
title: rel="me" links and Mastodon verification
description: How to add rel="me" links for Mastodon and IndieWeb verification.
layout: doc
permalink: /recipes/rel-me/
date: 2024-03-20
author: Slipway
---

## Verify your site on Mastodon and IndieWeb

To verify your site on Mastodon and other IndieWeb services, you can add `rel="me"` links. Slipway automatically includes these links in the footer if you configure them in your `_data/social.yml` file.

Since this feature relies only on Liquid templating, it works in **Classic mode** (GitHub Pages without a build step).

Create or edit `_data/social.yml` in your repository and add your social links like this:

```yaml
- network: github
  url: https://github.com/arminazimi/slipway
- network: mastodon
  url: https://mastodon.social/@example
- network: x
  url: https://x.com/example
```

For more details on Mastodon verification, read the [official Mastodon documentation](https://docs.joinmastodon.org/user/profile/#verification).
