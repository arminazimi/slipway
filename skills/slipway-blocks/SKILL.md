---
name: slipway-blocks
description: Choose a Slipway content block for a page and insert it with options that match the block's schema, then check that the page builds, reads without JavaScript, and passes slipway doctor.
---

# Insert content blocks

A block is one styled piece of a page that the theme ships: a status badge, a stat row, a timeline, an API endpoint. You insert it with a Liquid include and fill its options; the theme supplies the markup, the styles, and the right-to-left layout. If the site has an `AGENTS.md`, read it first and follow it, with the one exception this skill explains: a block's include line is the only Liquid a page may contain.

Use a block when a page needs one of those shapes. For prose, a list, a table, or a quotation, plain Markdown is lighter and needs no include.

## 1. Take a baseline

Get the theme's checks once, into a folder outside the site:

```sh
git clone --depth 1 https://github.com/arminazimi/slipway "$HOME/.slipway"
cd "$HOME/.slipway" && npm ci && cd -
```

Run section 5 on the page before you change it and keep the output. Your edit is done when it adds no problem and no finding except the Liquid warnings a block causes on purpose, which section 5 explains.

## 2. Choose the block

| Block | Use it for | Options |
| --- | --- | --- |
| badge | A status label next to a feature or a version | `label`; `status` is stable (the default), beta, deprecated, new, or experimental |
| compare | Pros and cons, or a feature matrix | `pros` and `cons` lists, or `headers` and `features`, each feature with a label and values of yes, no, partial, or an empty string for a blank cell |
| endpoint | An HTTP API reference | `path`; `method` defaults to GET; `parameters`, `request`, `response` |
| file-tree | A folder structure with a note per file | `items` (name, note, children) or `list` (a Markdown list) |
| gallery | A grid of images with captions and credits | `images`, each with a `src` and an `alt`; captions, credits, srcset, an intrinsic width and height, and lazy loading are optional |
| kbd | A keyboard shortcut with its Mac and non-Mac forms | `mac` and `other` |
| pull-quote | A quotation set off from the text | `text`; `author`, `source`, and `url` are optional |
| stats | A row of key numbers | `items`, each with a `label` and a `value`; `unit` and `trend` are optional |
| steps | A numbered tutorial or sequence | `steps`, each with a `title`; `url` and `description` are optional |
| terminal | Commands and the output they print | `commands`, one per line; `output` and `prompt` (the default is `$`) are optional |
| timeline | Dated events, such as a release history | `events`, each with a `date` and a `title`; `url` and `description` are optional |

If no row fits, do not force a block: write a Markdown list, table, or quote.

## 3. Read the options

- The include `_includes/blocks/timeline.html` is the source of truth: its options are the `include.*` names it reads. Do the same for any block by its file name.
- Its schema, `schema/blocks/timeline.schema.json`, gives the types, the required options, and the allowed values; the rest are in the [schemas folder](https://github.com/arminazimi/slipway/tree/main/schema/blocks). Ten blocks have one; `steps` does not, so read its include instead.
- Live examples are in the theme's [block reference](https://github.com/arminazimi/slipway/tree/main/site/blocks): one Markdown page per block under `site/blocks/`, with the front matter that feeds it and the rendered result; the file name is the block name. The `terminal` block has no page, only a schema.
- With the Slipway MCP server registered for the site, the `list_blocks` tool returns every block with its schema, its file, and an example snippet; `packages/mcp/README.md` says how to register it.
- Use only the options the schema lists. An include ignores an unknown option silently, and the schema rejects it, so a typo shows up as a block with missing text, not as an error. If the schema and the include disagree, the include wins for what renders; report the mismatch.

## 4. Insert it

1. Quote every literal string: `label="Beta"`. Liquid reads an unquoted value as a variable name, so `status=beta` passes nothing.
2. Put lists, maps, and multi-line values in the page's front matter under a key of your own, then pass the key: `events=page.release_events`. Unknown front matter keys are kept and ignored by the layouts. Do not reuse a theme key such as `title`, `description`, `date`, `layout`, or `tags` for block data.
3. Put a block-level include on its own line, with a blank line before and after, inside the section it belongs to. Wrap it in the nomarkdown markers shown in the examples below, so kramdown does not read the block's markup as text; without them the `kbd` block prints its script as a code sample. A `badge` is a span, so it may sit in a sentence.
4. Add the block's stylesheet when the include does not load it. `endpoint`, `gallery`, and `terminal` load their own; for the others, put this line once at the top of the page body, with the block's name: `{::nomarkdown}{% include component-css.html name="timeline" %}{:/nomarkdown}`. The file is in `assets/css/components/`. Sites that load it in an override slot do not need the line again.
5. Set the page's language and let the theme lay the block out. Never add `dir="rtl"`; the wrappers in the theme's own block pages only show both directions on one English page.
6. An address option (`url` on a step or an event) is a site path such as `/release-history.html`, not a link with a base URL.

A full page with the timeline block:

```markdown
---
title: Release history
description: What shipped, and when.
layout: page
release_events:
  - date: 2026-11-23
    title: Phase 3 begins
    description: The third phase starts.
  - date: 2026-12-01
    title: Timeline block implemented
    url: /release-history.html
---

## Releases

{::nomarkdown}{% include component-css.html name="timeline" %}{:/nomarkdown}

{::nomarkdown}
{% include blocks/timeline.html events=page.release_events %}
{:/nomarkdown}
```

Two short options can stay inline. A badge goes in the text; the keyboard shortcut goes in a wrapper:

```markdown
This feature is in {% include blocks/badge.html label="Beta" status="beta" %}.

{::nomarkdown}
{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}
{:/nomarkdown}
```

A block's data is page content: translate it like the rest of the page, and keep the include line the same.

## 5. Check the page

Check the front matter, including the lists the blocks read:

```sh
node "$HOME/.slipway/tools/theme/validate.mjs" .
```

Fix every problem at the file and line it prints, then build the site:

```sh
bundle exec jekyll build
```

A misspelled block or include is a build error. A wrong option value usually is not: the block renders with the option ignored or empty, so open the built page and look for the block's root class, `sl-<name>` with the block's name (`sl-timeline`, `sl-stats`, `sl-badge`), and its text. Then run the doctor on the source and the build:

```sh
node "$HOME/.slipway/packages/doctor/bin/slipway.mjs" doctor . --build _site
```

In a Jekyll or Slipway site the doctor reports each include line, and the stylesheet line, as jekyll.liquid-in-content: a warning that the content is tied to Jekyll. That is expected for a block and never lowers the level; blocks are the only Liquid a page may contain. Every other finding is yours to fix. Compare with your baseline.

Without a `Gemfile`, run the doctor without `--build`, push, and read the log of the Pages build; the block renders the same way.

## Never

- Never invent an option name or value; the schema's list is closed. Use the exact case in its enum, such as `beta`, never `Beta`.
- Never put an include inside a list item, a table cell, or (except a badge) a sentence; its HTML becomes text.
- Never add Liquid other than the include lines: no `{{ }}`, no variables, no filters. The rest of the page stays plain Markdown.
- Never edit `_includes/blocks/`, `assets/css/components/`, or the block schemas to make one page work; choose another block or change the data.
- Never add `dir="rtl"`, physical CSS, or an inline script for a block; language, logical properties, and the theme already handle it.
- Never remove a block only to clear its expected Liquid warning; that warning does not lower the level.
