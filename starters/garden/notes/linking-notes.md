---
title: Linking notes without a plugin
description: How backlinks work here with plain Liquid and two front matter keys.
layout: page
note: linking-notes
stage: seedling
planted: 2026-10-05
tended: 2026-10-29
links: [stages-of-growth, why-a-garden]
---

Most garden tools compute backlinks from the body of a note. That needs a parser, and a plugin that reads every page at build time. This garden does it the other way around: each note lists the keys of the notes it points at, in a `links` list in its front matter.

```yaml
note: linking-notes
links: [stages-of-growth, why-a-garden]
```

The backlink list at the bottom of every note then walks `site.pages` and keeps the notes whose `links` list contains this note's key. No plugin, no search through rendered text, and the links are visible where an agent or a person looks for them: the front matter at the top of the file.

The cost is that a link in the body and a link in `links` can drift apart. When I add a body link, I add the key too. A future task could compare the two and warn, the way the doctor checks translation pairs. This note is a seedling because that check does not exist yet; the idea is [still growing](stages-of-growth.html).

## Linked from

{% include garden-backlinks.html %}
