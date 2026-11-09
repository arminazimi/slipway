# One command to migrate a Slipway 0.2 site

`tools/migrate/run.ts` walks a Slipway 0.2 site, runs both migration steps, writes the result, and prints
a report of every file it changed and every step a person still has to finish (issue #1184).

```bash
node tools/migrate/run.ts examples/product-docs --dry-run
node tools/migrate/run.ts examples/product-docs
```

`npx slipway migrate [dir]` will call the same `main()` when `engine.cli` lands. Until then, run the file
with Node 22.18 or later (Node strips the types; nothing is compiled).

## What it does

1. **Config** ([`config.ts`](config.ts), issue #1182): converts `_config.yml` to `slipway.yml` with the
   mapping table in [ADR 0024](../../docs/adr/0024-site-config.md), keeps comments on keys that survive,
   validates the result against the engine's config schema, and reports every dropped key with its reason.
   It removes `_config.yml` only after a valid `slipway.yml` is written. When `slipway.yml` already exists,
   it leaves both files in place and says so.
2. **Content** ([`content.ts`](content.ts), issue #1183): renames the front-matter keys that changed
   (`layout`, `nav_order`, `direction`) and turns callout includes into `:::callout` directives. Every
   other Liquid tag or output is left exactly where it is and reported with its file and line.
3. **Navigation**: checks `_data/navigation.yml` against `schema/navigation.schema.json` and reports each
   problem at its line. Navigation is never rewritten, because a URL such as `docs/x` needs a person's
   decision.

A page is a `.md` or `.html` file under the site. Files and folders that start with `_` or `.` are skipped,
as the engine skips them (ADR 0024 rule 4): `_includes`, `_layouts`, and `_config.yml` are 0.2 machinery,
not pages. Generated Markdown twins (`*.twin.html`, ADR 0006) are skipped too; run the twin generator
again instead of migrating them.

## The report

```
Slipway migration report
site: /path/to/site
mode: dry run (nothing was written)

Would change (2)
  guide/install.md
  slipway.yml

Would remove (1)
  _config.yml

Manual steps (4)
  _config.yml — plugins: Jekyll plugins; optional front matter, README indexes, redirects, the sitemap, and SEO tags are built in
  _config.yml — remote_theme: names the theme that ships by default; slipway.yml needs no theme key
  guide/install.md:10 — Liquid output {{ site.title }} left in place; write it as Markdown or a directive
  _data/navigation.yml:3 — /main/0/url must match pattern "^/"

Errors (0)
  none
```

- **Changed files / Would change**: every file the command wrote, or would write.
- **Removed files / Would remove**: the 0.2 `_config.yml`, after a valid `slipway.yml` is written.
- **Manual steps**: dropped config keys, Liquid left in place, layouts with no engine name, and navigation
  problems. Each has the file and, when it has one, the line.
- **Errors**: a file that could not be read or a config that did not parse or validate. When there are
  errors, the failed conversion is not written; fix the source and run again.

## Options and exit codes

| Option | Effect |
| --- | --- |
| `--dry-run` | Reads and reports; writes and removes nothing. The report says `Would change` and `Would remove`. |
| `-h`, `--help` | Prints the usage. |

| Exit code | Meaning |
| --- | --- |
| `0` | The migration ran. Manual steps may remain; the report lists them. |
| `1` | A conversion failed: the site directory is missing, or a config did not parse or validate. |
| `2` | Bad arguments, such as an unknown option or two directories. |

With no directory the command prints its usage and exits `0`, so `npm run check` can run every
`tools/<name>/run.ts` as a check without giving it a site. A real migration always names the directory.

The migration is idempotent: a second run finds no `_config.yml`, no changed page, and the same
navigation report. Use `--dry-run` in CI to see what a newer release would change before it writes.

## Scope

The tool uses no new dependency. It calls the two modules from the earlier migration issues and only
changes the site it is given. It does not migrate `_layouts`, `_includes`, or `_data` files other than
navigation, and it does not fix links; those are follow-ups in the roadmap.
