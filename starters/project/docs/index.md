---
title: Overview
description: What Harbor caches, and what it deliberately does not.
layout: doc
permalink: /docs/
---

## What Harbor does

Harbor wraps `fetch` and stores each response by URL. A second call for the same URL reads the store until the entry expires.

## What Harbor does not do

- It does not deduplicate requests that are in flight; use one cache per caller if that matters.
- It does not cache responses with `Cache-Control: no-store`.
- It does not evict by size; `maxEntries` is the only limit.

## Next

- [Install](/docs/install/)
- [Quick start](/docs/quick-start/)
- [API](/docs/api/)
