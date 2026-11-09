# Source maps

A source map tells a tool which source file, and which line in it, produced each built page, heading, and link. With it, a broken link found in `/docs/intro.html` becomes "line 8 of `_docs/intro.md`", which is the line an agent or a person should edit.

The format is specified in [spec/sourcemap/v0.md](../spec/sourcemap/v0.md), checked by [`schema/sourcemap.schema.json`](../schema/sourcemap.schema.json), and motivated by [ADR 0007](adr/0007-source-maps.md). Exact columns and end positions are added by [ADR 0026](adr/0026-source-spans.md).

**Status:** the engine's build does not write `sourcemap.json` yet. This page describes the file it will write.

## The file

Every built site publishes one file, `/sourcemap.json`, at the root:

```json
{
  "version": 0,
  "pages": [
    { "url": "/about/", "source": "about.md" },
    {
      "url": "/docs/intro.html",
      "source": "_docs/intro.md",
      "sections": [
        { "id": "install", "level": 1, "line": 6, "text": "Install" },
        { "id": "whats-new", "level": 2, "line": 23, "text": "What’s new?" }
      ],
      "links": [{ "href": "../missing.md", "line": 8 }]
    }
  ]
}
```

- `version` is `0` until the format is frozen.
- Each entry in `pages` is one built page. `url` is its path from the site root; `source` is the file it came from, relative to the source folder, with forward slashes.
- `sections` lists the page's headings in order: the `id` the built HTML gives the heading, its level, its line in the source, and its text as the page shows it.
- `links` lists each link as written in the source (`href`) and its line.
- Every `line` is 1-based and counts from the first line of the file, front matter included, so it matches what an editor shows.

A page with no headings or links has no `sections` or `links` keys.

## Where the positions come from

The engine takes each block's position from the Markdown parser. [ADR 0022](adr/0022-engine.md) (rule 6) requires every block element in the HTML to carry `data-source="<path>:<line>"`: the source file relative to the site root and the line where the block starts. The source map is to be built from the same positions, so the HTML and the map agree.

## Checking it

`schema/sourcemap.schema.json` describes the file. A map must validate against it, and no `url` may appear twice. The rules for each field are in [spec/sourcemap/v0.md](../spec/sourcemap/v0.md); when the two disagree, the spec wins and this page is wrong.
