---
title: Install
description: Install Harbor from npm and check the Node version it needs.
layout: doc
permalink: /docs/install/
---

## Install

```bash
npm install harbor-cache
```

Harbor needs Node 20 or later, because it uses the global `fetch`.

## Check it

```bash
node -e "import('harbor-cache').then(() => console.log('ok'))"
```

## TypeScript

Types ship with the package; there is no separate `@types` package.
