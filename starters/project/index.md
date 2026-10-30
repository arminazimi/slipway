---
title: Harbor
description: A small HTTP cache for Node that stores responses in memory or on disk.
layout: home
variant: landing
cta_text: Get started
cta_url: /docs/install/
features:
  - title: Works with fetch
    text: Wrap the global fetch and hand the cached version to the rest of your code.
    url: /docs/quick-start/
  - title: In memory or on disk
    text: One store handles both; swap it when a process restarts.
    url: /docs/api/
  - title: MIT licensed
    text: One dependency, no runtime services, no account.
    url: /contributing/
---

```bash
npm install harbor-cache
```

```js
import { cache } from "harbor-cache";

const cached = cache(fetch, { ttl: 60_000 });
const response = await cached("https://example.com/data.json");
```

The second call reads the stored response until the TTL runs out, then fetches again.
