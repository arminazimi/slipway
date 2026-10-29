# Front matter schemas

JSON Schemas (draft 2020-12) for the front matter of Slipway pages, from the content model in [ADR 0003](../../docs/adr/0003-content-model.md). `base.schema.json` holds the keys every page may set; each layout schema builds on it. Unknown keys are kept and ignored, never rejected, so a site can add its own.

`node tools/theme/front-matter.mjs [file or folder ...]` validates Markdown files (every example site by default) and prints the file, the key, and the allowed values for each problem.

## Which schema a page uses

The `layout` key picks the schema. A page without `layout` gets the schema of its collection folder, and a page outside a collection gets `page`.

| Layout | Collection folder | Schema | Keys beyond `base` |
|---|---|---|---|
| `page`, `default`, `tags`, `not-found` | (any other folder) | [`page.schema.json`](page.schema.json) | none |
| `translation-status` | | [`translation-status.schema.json`](translation-status.schema.json) | none |
| `doc` | `_docs/` | [`doc.schema.json`](doc.schema.json) | none |
| `post` | `_posts/` | [`post.schema.json`](post.schema.json) | `author`: one id or a list of ids from `_data/authors.yml`; the date and slug come from the `YYYY-MM-DD-slug.md` file name |
| `home` | | [`home.schema.json`](home.schema.json) | `variant` (`editorial`, `landing`, `blog`, `docs`); `cta_text` and `cta_url`, set together; `features` (a list of `title`, `text`, `url`) for `landing`; `posts_limit` |
| `archive` | | [`archive.schema.json`](archive.schema.json) | none |
| `author` | | [`author.schema.json`](author.schema.json) | `author`, required: the id of the author in `_data/authors.yml` |
| `adr` | | [`adr.schema.json`](adr.schema.json) | `status`, `deciders`, `supersedes`, `superseded_by` |
| `adr-index` | | [`page.schema.json`](page.schema.json) | none |
| `changelog`, `changelog-feed` | | [`changelog.schema.json`](changelog.schema.json) | `feed_url`, `changelog` |
| any other layout (your own) | | [`base.schema.json`](base.schema.json) | |

## Shared keys

| Key | Type | Allowed values |
|---|---|---|
| `title` | string, required | not empty |
| `description` | string | |
| `lang` | string | a BCP 47 tag such as `en`, `fa`, `pt-BR` |
| `dir`, `direction` | string | `ltr`, `rtl` (`direction` is what the base layout reads today) |
| `date` | string | `YYYY-MM-DD`, optionally with a time and offset |
| `tags`, `categories` | list or string | a list, or one space-separated string |
| `nav_order` | number | |
| `layout` | string | a layout name |
| `permalink` | string | a path starting with `/`, or `pretty`, `date`, `ordinal`, `weekdate`, `none` |
| `published`, `sitemap`, `search` | boolean | `true`, `false` |
| `translation_key` | string | not empty; the same key on every translation of a page |
| `updated` | string | a date like `date`; a post shows it as "edited on", feeds and the sitemap use it as the last-modified date |
