---
# For agents that edit this site, not for readers: published: false keeps it out of the built site.
title: Agent guide
published: false
---

# AGENTS.md

How to edit this site. It is a Jekyll site built with the Slipway theme.

## Layout

- `_config.yml`: site settings.
- `index.md`: the home page.

## Check your edit

```sh
npm run build
npm run deploy
cat _data/navigation.yml
```

## Never

- Never edit `_site/`: the next build replaces it.
