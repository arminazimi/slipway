<!-- Generated from schema/front-matter/*.schema.json by tools/skills/front-matter-reference.mjs. Do not edit. -->
# Front matter keys

The keys every page may set (ADR 0003, decision 2). Unknown keys are kept and ignored, never rejected. The layout schemas build on this one.

## Which schema a page uses

The `layout` key picks the schema. A page without `layout` gets the schema of its collection folder, and a page outside a collection gets `page`. A layout not listed here gets `base.schema.json`.

| Layout | Folder | Schema | What it renders |
| --- | --- | --- | --- |
| `page`, `default`, `tags`, `not-found` |  | `page.schema.json` | A plain page: a title, a description, and text. Also used by the default, tags, and not-found layouts. |
| `doc` | `_docs/` | `doc.schema.json` | A documentation page with the sidebar from _data/navigation.yml, a table of contents, and previous and next links. |
| `post` | `_posts/` | `post.schema.json` | A dated post. The date and slug come from the file name (YYYY-MM-DD-slug.md); `date` in the front matter overrides the date. |
| `home` |  | `home.schema.json` | The landing page: a hero with an optional call to action, then the latest posts. |
| `archive` |  | `archive.schema.json` | Every post, grouped by year. |

## Every layout

| Key | Type | Required | Allowed | What it does |
| --- | --- | --- | --- | --- |
| `title` | string | yes | not empty | The page title, used in the heading, the tab, and feeds. |
| `description` | string |  |  | One sentence for search results and link previews. |
| `lang` | string |  | `^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$` | BCP 47 language tag, for example `en`, `fa`, or `pt-BR`. Defaults to the site language. |
| `dir` | `ltr` or `rtl` |  |  | Text direction (ADR 0003). Defaults to the direction of `lang`. |
| `direction` | `ltr` or `rtl` |  |  | Text direction as the base layout reads it today; same meaning as `dir`. |
| `date` | string |  | `^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?( ?(Z\|[+-]\d{2}:?\d{2}))?)?$` | YYYY-MM-DD, optionally with a time and a UTC offset (`2026-10-18 09:30:00 +0330`). |
| `tags` | list or string |  |  | Tags: a list, or one space-separated string as Jekyll allows. |
| `categories` | list or string |  |  | Categories: a list, or one space-separated string as Jekyll allows. |
| `nav_order` | number |  |  | Sort order in generated navigation. |
| `layout` | string |  | not empty | The layout that renders the page. Picks the schema in schema/front-matter/README.md. |
| `permalink` | string |  | `^(/\|(pretty\|date\|ordinal\|weekdate\|none)$)` | The output URL: a path starting with `/`, or one of Jekyll's built-in styles. |
| `published` | boolean |  |  | `false` leaves the page out of the build. |
| `translation_key` | string |  | not empty | Links the translations of one page; pages with the same key are alternates of each other. |
| `sitemap` | boolean |  |  | `false` leaves the page out of sitemap.xml. |
| `search` | boolean |  |  | `false` leaves the page out of the search index. |

## Only in `home`

| Key | Type | Required | Allowed | What it does |
| --- | --- | --- | --- | --- |
| `cta_text` | string |  | not empty | Label of the call-to-action button. Shown only with `cta_url`. Set together with `cta_url`. |
| `cta_url` | string |  | `^(/\|https://)[^\s"<>]*$` | Where the call-to-action button goes. Set together with `cta_text`. |
