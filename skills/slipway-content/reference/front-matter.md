# Front matter keys

The front matter keys the Slipway engine reads (ADR 0024, rule 3). The engine passes every key to the layout, known or not, and never rejects an unknown key. Write only the keys listed here unless the site's theme documents its own.

Front matter is a YAML block between two `---` lines at the top of a `.md` or `.html` file. A page without front matter still builds: its title is its first `h1`, its URL comes from its file path, and its layout comes from `defaults` in `slipway.yml` or from the theme.

## Keys the engine reads

| Key | Type | Allowed | What it does |
| --- | --- | --- | --- |
| `title` | string | not empty | Page title. Without it, the first `h1` of the body; without that, the file name. |
| `description` | string | | One sentence for the meta description, the `llms.txt` entry, and the search excerpt. |
| `layout` | string | a layout name the theme ships | The theme layout that renders the page. Unset, it comes from `defaults`, then the theme's default layout. An unknown name is an error. |
| `permalink` | string | a path starting with `/` | The output URL. Unset, the URL comes from the file path: `guide/install.md` and `guide/install/index.md` both give `/guide/install/`. |
| `redirect_from` | string or list of strings | paths | Old paths that redirect to this page. |
| `redirect_to` | string | a path on the site or an `https` URL | This page redirects there; its body is not rendered. |
| `lang` | string | a BCP 47 tag, such as `en` or `fa` | Language of the page. Unset, it comes from the language prefix of its folder (`fa/install.md` is `fa`), then from `lang` in `slipway.yml`. |
| `dir` | string | `ltr` or `rtl` | Text direction. Unset, it comes from the page's `lang`. |
| `order` | number | | Sort order among siblings in navigation built from folders. Pages without it follow, sorted by title. |
| `status` | string | `experimental`, `beta`, `deprecated`, `proposed`, `accepted`, `rejected`, or `superseded` | Lifecycle of the page. The engine checks the value; the theme decides how to show it. |
| `agent` | object | keys `edit`, `source`, `notes` | Instructions for agents that edit this page. `edit: false` marks a generated page that must be changed at its source; `source` names the file to edit instead; `notes` is a short instruction. |
| `published` | boolean | `true` or `false` | `false` keeps the page out of the build. |
| `image` | string | a path on this site or an `https` URL | The page's social image. |
| `translation_key` | string | not empty | Links a page to its translations. Use the same key on every translation of a page. |
| `search` | boolean | `true` or `false` | `false` leaves the page out of the search index. |

## Deprecated aliases

These keys still work through `0.3.x`, with a warning that names the file and line. Use the new key in new content.

| Old key | Use instead |
| --- | --- |
| `nav_order` | `order` |
| `direction` | `dir` |

## Folder defaults

`defaults` in `slipway.yml` sets front matter for every page under a folder, such as `layout` for all of `docs/`. A key in a page's own front matter always wins over `defaults`. See [slipway.yml keys](../../slipway-site/reference/config.md).
