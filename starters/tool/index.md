---
title: Orbit
description: Deploy a folder to your own server in one command, with logs and rollbacks.
layout: home
variant: landing
cta_text: Install
cta_url: /docs/install/
features:
  - title: One command
    text: Point orbit at a folder and it uploads, swaps, and reports the URL.
    url: /docs/commands/
  - title: Your own server
    text: No platform account; any host you can reach over SSH.
    url: /docs/
  - title: Roll back in seconds
    text: Every deploy is a release you can return to.
    url: /docs/commands/
---

```bash
npm install -g orbit-cli
orbit deploy ./public
```

Orbit uploads `./public` as a new release, points the server at it, and prints the URL. Run `orbit rollback` to go back one release.
