---
title: Quick start
description: Wrap fetch with a cache in five lines.
layout: doc
permalink: /docs/quick-start/
---

## Cache the global fetch

```js
import { cache } from "harbor-cache";

const cached = cache(fetch, { ttl: 60_000 });
const first = await cached("https://example.com/data.json");
const second = await cached("https://example.com/data.json");
```

`first` and `second` read the same stored response, so the second call makes no request until the entry expires.

## Share one cache

```js
import { cache, memoryStore } from "harbor-cache";

const store = memoryStore({ maxEntries: 500 });
const cached = cache(fetch, { store, ttl: 300_000 });
```

Pass the same `store` to every caller that should share entries.

## Keep entries across restarts

```js
import { cache, diskStore } from "harbor-cache";

const store = diskStore("./.cache");
const cached = cache(fetch, { store, ttl: 3_600_000 });
```

The disk store keeps one file per URL; delete the folder to clear it.
