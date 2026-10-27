---
title: Content negotiation
description: 'How to answer Accept: text/markdown with the twins on Netlify and Cloudflare Pages.'
layout: doc
permalink: /recipes/content-negotiation/
date: 2024-03-20
author: Slipway
---

## Content negotiation for Markdown twins

Slipway generates a Markdown twin for every page on your site. You can use standard HTTP content negotiation to serve these `.md` files when a client asks for `text/markdown`. This allows agents, CLI tools, and browsers that support it to easily retrieve the raw content without HTML framing.

Here is how you can set this up on Netlify and Cloudflare Pages.

### Netlify

Netlify allows configuring routing and custom headers.

Add a `_redirects` file to the root of your publish directory to route requests with `Accept: text/markdown` to the `.md` twin.

```text
/*  /:splat.md  200!  Language=text/markdown
```

Add a `_headers` file to set the `Content-Type` for the returned Markdown files.

```text
/*.md
  Content-Type: text/markdown
```

### Cloudflare Pages

Cloudflare Pages uses similar files for routing and headers.

Create a `_redirects` file at the root of your publish directory (e.g. `_site`):

```text
/*  /:splat.md  200  Accept=text/markdown
```

Create a `_headers` file to ensure the `.md` files are served with the correct `Content-Type`:

```text
/*.md
  Content-Type: text/markdown
```
