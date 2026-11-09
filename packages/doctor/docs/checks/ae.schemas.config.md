# ae.schemas.config

Each configuration file that the generator reads MUST match an entry with `target: "file"` in `content-schemas.json`.

## Why

A configuration file without a schema is the one file an agent edits without a check: a wrong key or value builds a site that quietly ignores it. The index names the schema for every file the generator reads, so `ae.schemas.valid` can validate the whole file.

## How to fix

Add a `target: "file"` entry whose `files` glob matches the config file. An engine site's config is `slipway.yml` (or `mizzen.yml`):

```json
{
  "version": "0.1",
  "schemas": [
    { "files": ["slipway.yml"], "target": "file", "schema": "schema/config.schema.json" }
  ]
}
```

A Jekyll site adds `_config.yml` the same way.
