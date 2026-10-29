<!-- Generated from schema/front-matter/*.schema.json by tools/skills/front-matter-reference.mjs. Do not edit. -->
# Front matter keys

The keys every page may set (ADR 0003, decision 2). Unknown keys are kept and ignored, never rejected. The layout schemas build on this one.

## Which schema a page uses

The `layout` key picks the schema. A page without `layout` gets the schema of its collection folder, and a page outside a collection gets `page`. A layout not listed here gets `base.schema.json`.

| Layout | Folder | Schema | What it renders |
| --- | --- | --- | --- |
| `page`, `default`, `tags`, `not-found`, `adr-index` |  | `page.schema.json` | A plain page: a title, a description, and text. Also used by the default, tags, and not-found layouts. |
| `doc` | `_docs/` | `doc.schema.json` | A documentation page with the sidebar from _data/navigation.yml, a table of contents, and previous and next links. |
| `post` | `_posts/` | `post.schema.json` | A dated post. The date and slug come from the file name (YYYY-MM-DD-slug.md); `date` in the front matter overrides the date. |
| `home` |  | `home.schema.json` | The landing page in one of four variants: an editorial hero with the latest posts (the default), a landing page with features and a call to action, a blog index, or a docs index. |
| `archive` |  | `archive.schema.json` | Every post, grouped by year. |
| `author` |  | `author.schema.json` | One author's page: the avatar, bio, and links from `_data/authors.yml`, then that author's posts in the page's language. Bylines link here. |
| `changelog`, `changelog-feed` |  | `changelog.schema.json` | A Keep a Changelog page or its Atom feed of dated releases. |
| `adr` |  | `adr.schema.json` | An architecture decision record with status, deciders, and supersession links. |

## Every layout

| Key | Type | Required | Allowed | What it does |
| --- | --- | --- | --- | --- |
| `canonical_url` | string |  | `^(/\|https://)[^\s"<>]*$` | The original URL of the page, if it was first published elsewhere. |
| `categories` | list or string |  |  | Categories: a list, or one space-separated string as Jekyll allows. |
| `date` | string |  | `^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?( ?(Z\|[+-]\d{2}:?\d{2}))?)?$` | YYYY-MM-DD, optionally with a time and a UTC offset (`2026-10-18 09:30:00 +0330`). |
| `description` | string |  |  | One sentence for search results and link previews. |
| `dir` | `ltr` or `rtl` |  |  | Text direction (ADR 0003). Defaults to the direction of `lang`. |
| `direction` | `ltr` or `rtl` |  |  | Text direction as the base layout reads it today; same meaning as `dir`. |
| `image` | string |  | `^(/\|https://)[^\s"<>]*$` | The page's own social image (`og:image`): a path on this site or an https link. Without it, Actions mode generates one from the title, and every mode falls back to the shared `assets/images/social.png`. |
| `lang` | string |  | `^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$` | BCP 47 language tag, for example `en`, `fa`, or `pt-BR`. Defaults to the site language. |
| `layout` | string |  | not empty | The layout that renders the page. Picks the schema in schema/front-matter/README.md. |
| `nav_order` | number |  |  | Sort order in generated navigation. |
| `owner` | string |  |  | The owner of this page. |
| `permalink` | string |  | `^(/\|(pretty\|date\|ordinal\|weekdate\|none)$)` | The output URL: a path starting with `/`, or one of Jekyll's built-in styles. |
| `published` | boolean |  |  | `false` leaves the page out of the build. |
| `replaced_by` | string |  | `^(/\|https://)[^\s"<>]*$` | The URL of the page that replaces this one, if deprecated. |
| `review_date` | string |  | `^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?( ?(Z\|[+-]\d{2}:?\d{2}))?)?$` | The date this page was last reviewed. |
| `search` | boolean |  |  | `false` leaves the page out of the search index. |
| `since` | string |  |  | The version when the page status was set. |
| `sitemap` | boolean |  |  | `false` leaves the page out of sitemap.xml. |
| `status` | `experimental` or `beta` or `deprecated` or `proposed` or `accepted` or `rejected` or `superseded` |  |  | The page status; ADR records also accept proposed, accepted, rejected, and superseded. |
| `tags` | list or string |  |  | Tags: a list, or one space-separated string as Jekyll allows. |
| `title` | string | yes | not empty | The page title, used in the heading, the tab, and feeds. |
| `translation_key` | string |  | not empty | Links the translations of one page; pages with the same key are alternates of each other. |
| `updated` | string |  | `^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?( ?(Z\|[+-]\d{2}:?\d{2}))?)?$` | The date the page was last substantially edited. A post shows it as "edited on" after its publish date, and feeds, the sitemap, and structured data use it as the last-modified date. |
| `width` | `narrow` or `wide` or `full` |  |  | Page width: `narrow` (34rem), `wide` (64rem), or `full` (the whole window). Leave it out for the reading width. Inside any width, wrap a section in `.sl-wide` or `.sl-bleed` to widen it. |

## Only in `post`

| Key | Type | Required | Allowed | What it does |
| --- | --- | --- | --- | --- |
| `author` | string or list |  |  | Who wrote the post: one key of `_data/authors.yml`, or a list of keys for several authors. The post shows a byline and an author box for each. |
| `series` | string |  | not empty | The name of the series the post belongs to. Posts with the same name and language form the series, oldest first; each shows a series box with its part, the other parts, and the previous and next part. |
| `toc` | boolean |  |  | `true` shows a table of contents of the post's h2 and h3 headings after the header, and a reading-progress bar at the top of the viewport while scrolling. Long posts benefit most; the bar is drawn with CSS, so it works without JavaScript. |

## Only in `home`

| Key | Type | Required | Allowed | What it does |
| --- | --- | --- | --- | --- |
| `cta_text` | string |  | not empty | Label of the call-to-action button. Shown only with `cta_url`. Set together with `cta_url`. |
| `cta_url` | string |  | `^(/\|https://)[^\s"<>]*$` | Where the call-to-action button goes. Set together with `cta_text`. |
| `features` | list |  |  | Feature cards for the `landing` variant, in order. |
| `posts_limit` | integer |  |  | How many posts the `editorial` and `blog` variants list. Defaults to 5 for `editorial` and every post for `blog`. |
| `variant` | `editorial` or `landing` or `blog` or `docs` |  |  | How the home page is laid out. `editorial`: a large hero, the body, then the latest posts. `landing`: the hero, the body, the `features` grid, and the call to action again. `blog`: a compact heading, the body, then every post. `docs`: the hero, the body, then the `docs` list of `_data/navigation.yml` as cards. |

## Only in `author`

| Key | Type | Required | Allowed | What it does |
| --- | --- | --- | --- | --- |
| `author` | string | yes | `^[A-Za-z0-9][A-Za-z0-9_-]*$` | The key of this author in `_data/authors.yml`. |

## Only in `changelog`, `changelog-feed`

| Key | Type | Required | Allowed | What it does |
| --- | --- | --- | --- | --- |
| `changelog` | string |  | `^(/\|https://)[^\s"<>]*$` | The changelog page URL whose releases a changelog-feed page exports. |
| `feed_url` | string |  | `^(/\|https://)[^\s"<>]*$` | The URL of a page using the changelog-feed layout. |

## Only in `adr`

| Key | Type | Required | Allowed | What it does |
| --- | --- | --- | --- | --- |
| `date` | string |  | `^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?( ?(Z\|[+-]\d{2}:?\d{2}))?)?$` | The date this decision was recorded. |
| `deciders` | list |  |  | The people who made this decision. |
| `layout` | any | yes |  | The ADR layout. |
| `status` | `proposed` or `accepted` or `rejected` or `superseded` or `deprecated` | yes |  | The decision's lifecycle status. |
| `superseded_by` | string |  |  | The title of the ADR that replaces this decision. |
| `supersedes` | string |  |  | The title of the ADR replaced by this decision. |
