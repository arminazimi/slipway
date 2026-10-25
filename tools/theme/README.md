# Theme tools

Node scripts that check the theme and the example sites. `npm run check` runs them; see [AGENTS.md](../../AGENTS.md) for the full list.

## Schema validation

`npm run check:schemas` validates `_config.yml` and the front matter of every Markdown page in each example site against the schemas in [`schema/`](../../schema): [`slipway-config.schema.json`](../../schema/slipway-config.schema.json) and [`front-matter/`](../../schema/front-matter/README.md). `node tools/theme/validate.mjs <site folder ...>` checks other sites. It exits 1 when any problem is found.

Each problem is one line on standard error:

```text
<path>:<line> <key>: <message> (allowed: <value>, <value>, ...)
```

- `<path>` is relative to the current folder, and `<line>` is the 1-based line of the key (of its parent when the key is missing).
- `<key>` is the front-matter key, or a dotted path into `_config.yml` such as `slipway.languages.0.code`. `/` means the whole file, for example when the YAML does not parse.
- `(allowed: ...)` lists the allowed values, or describes the expected form; it is left out when there is nothing to list.

```text
examples/blog/_config.yml:4 slipway.languags: is not a known key (allowed: languages, persian, tokens)
examples/blog/_posts/2026-10-20-hello.md:3 direction: must be equal to one of the allowed values (allowed: ltr, rtl)
examples/blog/about.md:2 title: is required
```

`validateSite(dir)` in `validate.mjs` returns the same problems as objects (`file`, `line`, `key`, `message`, `allowed`) without printing or exiting, for other tools such as `slipway doctor`.
