# Site files: what Slipway generates and what a site may own

Slipway publishes a fixed set of generated files at the site root. A generator-written site can replace any of
them with its own copy at the same URL: `slipway doctor` then asks for nothing, because the site ships the file.
This page is the contract behind the `jekyll.stubs` check; [docs/modes.md](modes.md) covers classic Pages versus
Actions mode and [starter-files/](../starter-files/README.md) is the folder a new site copies.

## The files

| URL | Slipway ships it as | A site may own it | What the site needs |
| --- | --- | --- | --- |
| `/404.html` | the `404.md` stub in `starter-files/`, which selects the `not-found` layout | yes | a `404.md` with that layout, or its own page at `/404.html` |
| `/search.json` | the `search.json` stub in `starter-files/`, which selects the `search-index` layout | yes | its own index at the same URL; the search box reads the URL of the `search-index` page |
| `/feed.xml` | the `jekyll-feed` plugin on GitHub Pages, or a `feed` layout stub per language for a multilingual site | yes | its own feed at the same URL |
| `/sitemap.xml` | the `jekyll-sitemap` plugin, or a `sitemap` layout stub with `hreflang` entries | yes | its own sitemap at the same URL |
| `/llms.txt`, `/llms-full.txt` | an `llms` and an `llms-full` layout stub; no plugin generates these | yes | its own text files at the same URLs |
| `/robots.txt` | never: Slipway does not write one | yes | its own file, or none |
| `/sourcemap.json`, `*.twin.html` | the Actions-mode plugins and `npm run sourcemap` / `npm run twins` | no | generator-specific; see [source-maps.md](source-maps.md) |
| `.vscode/settings.json` | the copy in `starter-files/`, which maps the config and navigation files to their schemas | yes | see [editor.md](editor.md) |

## What doctor checks

`jekyll.stubs` is a warning check with a `fix`, and it only ever names the four files of `starter-files/` (except
its README): `AGENTS.md`, `.vscode/settings.json`, `search.json`, and `404.md`. It looks at the file, not at how
the site made it: a hand-written `sitemap.xml`, `llms.txt`, `llms-full.txt`, or `robots.txt` with or without front
matter satisfies the site, and none of those four names is part of the required-stub list. A site with neither the
stub nor its own file still gets the same finding as before.

`packages/doctor/test/fixtures/own-site-files/` is the site that owns all four, and
`packages/doctor/test/own-site-files.test.mjs` fails if a later change starts asking for them.

## Known gap

`_includes/head.html` links `/feed.xml` and `_includes/search.html` finds `/search.json` through
`_includes/layout-url.html`, which looks for a *page with the matching layout*. A site that ships its own feed or
search index without that front matter keeps the URL working but loses the `<link>` and the search box, so those
two files are the ones worth copying as stubs even when a site also generates its own.
