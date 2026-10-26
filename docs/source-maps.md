# Source maps

A source map tells a tool which Markdown file, and which line in it, produced each built page, heading, and link. With it, a broken link found in `/docs/intro.html` becomes "line 8 of `_docs/intro.md`", which is the line an agent or a person should edit. The format is open: [spec/sourcemap/v0.md](../spec/sourcemap/v0.md) defines it, [`schema/sourcemap.schema.json`](../schema/sourcemap.schema.json) checks it, and [ADR 0007](adr/0007-source-maps.md) records why it has three levels.

## The file

Every Slipway site publishes one file, `/sourcemap.json`, at the root of the built site:

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

- `version` is always `0` until the format is frozen.
- Each entry in `pages` is one built page: `url` is its path from the site root, and `source` is the file it came from, relative to the site's source folder, with forward slashes.
- `sections` lists the page's headings in order: the `id` the built HTML gives the heading, its level, the line in the source file, and its text as the page shows it.
- `links` lists each link as written in the source (`href`) and its line.
- Every `line` counts from the first line of the file, front matter included, so it matches what an editor shows.

The first page has no `sections` or `links`: that is what the map looks like at level 0.

## What each mode gives you

| How the site is built | Level | What the map holds | How to get it | Can it go stale? |
| --- | --- | --- | --- | --- |
| Classic GitHub Pages | 0 | Pages only: `url` and `source` | Nothing to do: a `sourcemap.json` page on the `sourcemap` layout writes it in Liquid | No |
| Classic Pages with a committed file | 1 | Pages, sections, and links, with exact lines | Run `npm run sourcemap -- <site>` and commit `sourcemap.json`; it replaces the level 0 page | Yes, until you run it again; `npm run sourcemap -- <site> --check` fails when it is stale |
| Actions mode | 2 | Pages, sections, and links, with exact lines and the ids the build wrote | Copy `_plugins/slipway_sourcemap.rb` into the site; it writes the map at every build | No |

Classic mode cannot compute lines in Liquid: Liquid only sees the converted HTML, and an estimate looks right in a demo and is wrong on real documents (ADR 0007). Levels 1 and 2 run the same Ruby code, which parses each page with the kramdown of the GitHub Pages gem; they differ only in when it runs. [The two modes](modes.md) covers the rest of what classic and Actions mode can do.

## Emit it from another theme

Any generator can publish the file; a tool that reads it does not care which one wrote it. Start at level 0, which needs only a template, and check the output against the schema.

### Jekyll, in Liquid

Save this as `sourcemap.json` at the root of the site. It lists every HTML page and every document of a collection that is published:

```liquid
---
layout: null
permalink: /sourcemap.json
---
{%- assign items = site.html_pages -%}
{%- for collection in site.collections -%}
  {%- if collection.output -%}{%- assign items = items | concat: collection.docs -%}{%- endif -%}
{%- endfor -%}
{"version":0,"pages":[
{%- for item in items -%}
{"url":{{ item.url | jsonify }},"source":{{ item.path | jsonify }}}{% unless forloop.last %},{% endunless %}
{%- endfor -%}
]}
```

`jsonify` escapes quotes and keeps non-Latin file names valid. Slipway's own `sourcemap` layout does the same and also skips generated files such as the feed and the sitemap.

### Hugo

The [Hugo adapter](../adapters/hugo/README.md) does all of this and adds sections and links with their lines. To write a level 0 map by hand instead:

Add an output format for the home page in `hugo.toml`:

```toml
[outputFormats.sourcemap]
mediaType = "application/json"
baseName = "sourcemap"
isPlainText = true
notAlternative = true

[outputs]
home = ["html", "rss", "sourcemap"]
```

Then save the template as `layouts/index.sourcemap.json`. It skips pages Hugo generates without a file, such as taxonomy lists, and assumes the content folder is `content`:

```go-html-template
{{- $pages := slice -}}
{{- range $page := site.Pages -}}
  {{- if and $page.File $page.RelPermalink -}}
    {{- $pages = $pages | append (dict "url" $page.RelPermalink "source" (path.Join "content" $page.File.Path)) -}}
  {{- end -}}
{{- end -}}
{{- dict "version" 0 "pages" $pages | jsonify -}}
```

### Lines

Sections and links need the Markdown parser's own positions, so they belong in the build, not in a template. Slipway's code for kramdown is in `_plugins/slipway_sourcemap.rb`; a port to another parser should keep its two rules: count lines from the top of the file, front matter included, and record the heading id the HTML converter actually wrote.

### Check it

`validateSourcemap` in `tools/theme/sourcemap.mjs` checks a map against the schema and that no `url` appears twice. `tools/theme/docs.test.mjs` runs both templates above on small sites and validates what they write, so this page cannot drift from the schema.
