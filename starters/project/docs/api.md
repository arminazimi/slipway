---
title: API
description: The functions Harbor exports and the options each one takes.
layout: doc
permalink: /docs/api/
---

## `cache(fetch, options)`

Returns a function with the same arguments as `fetch` that reads and writes a store.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `store` | store | `memoryStore()` | Where responses are kept. |
| `ttl` | number | `0` | Milliseconds an entry stays fresh. `0` means no caching. |
| `maxEntries` | number | `1000` | How many entries a memory store keeps; the oldest goes first. |

## `memoryStore(options)`

Keeps entries in a `Map`. Options: `maxEntries`. Entries are lost when the process exits.

## `diskStore(directory)`

Keeps one file per URL under `directory`. It creates the folder when it is missing and reads it on the first call.

## Stores

A store is an object with `get(key)`, `set(key, value, ttl)`, and `delete(key)`, each returning a promise. A custom store only has to implement those three methods.
