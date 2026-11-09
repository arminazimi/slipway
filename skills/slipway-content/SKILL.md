---
name: slipway-content
description: Write or edit a page on a Slipway site, or translate one into another language, using the engine's front matter keys and directives, then check it with slipway check.
metadata:
  version: "0.3.0"
---

# Write pages on a Slipway site

A Slipway site is a folder of Markdown files, each with an optional block of front matter. The engine builds every `.md` and `.html` file under the site's `source` folder into a page; the theme renders the title, the navigation, the table of contents, and the language switcher. You write the front matter and the words. If the site has an `AGENTS.md`, read it first; it wins where it differs from this Skill.

## 1. Take a baseline

Run the check once, before you change anything, and keep its output:

```sh
slipway check .
```

Run it from the site folder. Your edit is done when it adds no finding that names your file.

`slipway` is the engine's command line. It is released with the engine (`engine.cli`). Until it is installed, no check can run: say so in your report and do not invent a result.

## 2. Pick the file and its URL

| You are writing | File | URL |
| --- | --- | --- |
| A page | any `.md` file under the source folder, such as `guide/install.md` | the path: `/guide/install/` |
| A folder's index | `index.md`, or `README.md` when the folder has no `index.md` | the folder: `/guide/` |
| A page in another language | a file under that language's prefix folder, such as `fa/install.md` | the prefix and the path: `/fa/install/` |
| A page that moves or has a custom address | any file, with `permalink` | the `permalink` value |

Folders whose names start with `.` or `_` are skipped, unless `slipway.yml` lists them under `include`. Files in `node_modules`, the output folder, and `slipway.yml` are never pages.

Do not rename or move a published page to change its title. Set `title`. A page's address is its path or its `permalink`, and links to it would break if you change it. To change an address on purpose, set `permalink` and add a `redirect_from` entry for the old one.

Set `published: false` to keep a draft out of the build. Do not create `_posts/` folders: posts are not part of the engine.

## 3. Fill the front matter

Every key the engine reads, its type, and its allowed values are in [reference/front-matter.md](reference/front-matter.md). Use only keys it lists.

- `title` is the page heading. Without it, the first `h1` is used.
- `description`: one sentence for the meta description, `llms.txt`, and search.
- `order`: a number that sorts the page among its siblings in navigation built from folders.
- `layout` is usually left out. The folder's `defaults` in `slipway.yml` or the theme's default layout applies. Set it only when the theme documents the layout name.
- `permalink` starts with `/`. Leave it out unless the address must differ from the path.
- `redirect_from` lists old addresses (a string or a list) that now redirect to this page.
- `status` is one of `experimental`, `beta`, `deprecated`, `proposed`, `accepted`, `rejected`, or `superseded`.
- `agent` tells agents how to edit the page: `edit: false` for a generated page, `source` for the file to edit instead, and `notes` for one short instruction.
- Quote a value that contains `: ` or starts with a character YAML treats specially (`[`, `{`, `*`, `&`, `!`, `#`, `|`, `>`, `@`, or a backtick).

Two keys are deprecated aliases: `nav_order` is `order`, and `direction` is `dir`. Do not write them in new content; the engine warns about them.

## 4. Write the body

- Plain Markdown. The title is the page heading, so start sections at `##` and never add a second `#` heading.
- Keep heading levels in order (`##`, then `###`), so the table of contents finds every section.
- Link to a page by its URL path, such as `[Install](/docs/install/)`. Check the link with `slipway check`.
- Give each image alt text: `![A chart of build times](/assets/build-times.png)`.
- Give every code block a language (` ```yaml `), so it highlights and reads left to right on a right-to-left page.

### Directives

The engine turns these into theme components. A name the theme does not ship renders as an unknown-component warning, so use only the names below.

| Write | Component | Options |
| --- | --- | --- |
| `:::callout{type=tip}` … `:::` | `callout` | `type`: `note` (default), `tip`, `important`, `warning`, `caution`. `title="…"` replaces the default heading. |
| `> [!WARNING]` followed by a quote | `callout` | GitHub alert: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`. |
| `:::details{summary="…"}` … `:::` | `details` | `summary` is the visible label. Add `open` to start expanded. |
| `:::steps` … `:::` | `steps` | The body is one ordered list. |
| `:::file-tree{label="…"}` … `:::` | `file-tree` | The body is a nested list. A name ending in `/` is a folder; text after ` # ` is a note on that row; `**name**` highlights it. |
| `:badge[New]{variant=tip}` | `badge` | Inline. `variant`: `note` (default), `tip`, `important`, `warning`, `caution`. |
| `::badge{label=new}` | `badge` | Block form, with `label` as the text. |

Example, from [examples/doc-page.md](examples/doc-page.md):

```markdown
:::callout{type=tip}
The binary has no dependencies. Copying it to another machine is enough.
:::
```

Use a callout for a note the reader must not miss, not for decoration.

[examples/doc-page.md](examples/doc-page.md) is a template for a doc page: its first comment says where the file goes.

## 5. Add a translation

1. The language must be in `languages` in `slipway.yml`, with a `code`, a `name`, and a `prefix` such as `/fa`. If it is missing, ask the owner before you add it: it changes every page's language switcher.
2. Give the original page a `translation_key` (such as `install`) if it has none, and a `lang` if it does not inherit one from its folder. The switcher links a page and its translations by `translation_key`.
3. Give the translation the same `translation_key`, and `lang` set to its language code. Its URL comes from its path under the prefix folder: `fa/install.md` becomes `/fa/install/`.
4. Translate `title`, `description`, and the body. Keep the `translation_key`, the code, the commands, the file names, and the URLs as they are.
5. Do not set `dir` on a translation. The direction comes from `lang`: `fa`, `ar`, `he`, and `ur` are right to left.
6. In Persian text, use Persian `ی` and `ک` (not the Arabic `ي` and `ك`), a zero-width non-joiner in words such as `می‌شود`, and Persian punctuation (`،` and `؟`). Put commands, file names, and code in backticks: they stay left to right inside the sentence.

Change `translation_key` on every page that shares it, or on none. Changing it on one translation only breaks the link.

## 6. Check the edit

From the site folder:

```sh
slipway check .
```

Each finding is printed with its file and line. Fix it at that line and run the check again. To get a machine-readable report, add `--format json` or `--format sarif`.

Build the site before you finish a change to navigation, languages, or directives:

```sh
slipway build . --out dist
```

Read every error and warning and fix it at the file it names. Then compare the result with your baseline: a finding that names your file is yours to fix.

## Never

- Never invent a front matter key that [reference/front-matter.md](reference/front-matter.md) does not list.
- Never write a second `#` heading in the body.
- Never edit the output folder (`dist/` or the folder you passed to `--out`); the build replaces it.
- Never create `_posts/` pages. Posts are not part of the engine.
- Never rename or move a published page to change its title; set `title`.
- Never change `translation_key` on one translation only.
- Never change theme layouts or components to change how one page looks.
