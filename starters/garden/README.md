# Digital garden starter

Notes that start small and grow in public. Each note says how grown it is, links to the notes it builds on, and lists the notes that link back to it.

Everything here is copied as is by a new site except this README.

| File | What it is for |
| --- | --- |
| `AGENTS.md` | What an agent reads before editing the site. |
| `_config.yml` | The site's title, language, and theme. |
| `_data/navigation.yml` | The header menu. |
| `index.md` | The home page, using the `landing` home variant. |
| `garden.md` | The index of every note, grouped by stage, with a recently-tended list. |
| `notes/*.md` | The notes themselves. |
| `_includes/garden-backlinks.html` | The backlink list under each note. |

## Stages and backlinks

A note's front matter carries four keys:

```yaml
note: linking-notes          # a short key other notes link to
stage: seedling              # seedling, budding, or evergreen
planted: 2026-10-05
tended: 2026-10-29
links: [stages-of-growth]    # the keys of the notes this one points at
```

`garden.md` groups notes by `stage` and lists the five with the latest `tended` date. Every note ends with the `garden-backlinks` include, which walks `site.pages` and keeps the notes whose `links` contain this note's key. It is plain Liquid, so it works in classic and Actions mode alike.

The backlinks come from `links`, not from the body of the note. When you add a link in the text, add the key to `links` too.

## Add a note

1. Copy `notes/why-a-garden.md` to `notes/<slug>.md`.
2. Change `title`, `description`, `note`, `stage`, and `planted`, and set `tended` to today.
3. Link to it from another note and add its key to that note's `links`, or use `/garden.html` as the way in.

## Build

```bash
npm ci
npm run check
```
