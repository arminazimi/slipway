---
title: Install
description: Install Orbit from npm and point it at your server once.
layout: doc
permalink: /docs/install/
---

## Install

```bash
npm install -g orbit-cli
```

## Point it at your server

```bash
orbit init --host deploy@example.com --path /srv/orbit
```

Orbit writes `.orbit.json` next to your project:

```json
{
  "host": "deploy@example.com",
  "path": "/srv/orbit"
}
```

Commit the file so everyone deploys to the same place. Never put a password or key in it; Orbit uses your SSH agent.
