# 0006. Markdown twins: a stub per page on classic Pages, a generator in Actions mode

**Status:** Accepted (2026-10-18). Supersedes one detail of ADR 0003: the front matter key `dir` is renamed `direction`.

## Context

Slipway promises a raw Markdown copy of every page (a "twin"), at the same address with `.md`, so an agent can read a page's source instead of its HTML. Seaworthy checks such copies (`readability.md-alternates`) and the Markdown-for-agents idea depends on them. Plain GitHub Pages runs Jekyll with a fixed set of plugins and no custom code. Issue #1 asks whether it can emit a twin per page at all.

## Method

A throwaway site built with the same engine as GitHub Pages: the `github-pages` gem 232 (Jekyll 3.10.0, Liquid 4.0.4, the whitelisted plugins, safe mode), Ruby 3.3.12. The Pages environment lists Ruby 3.3.4, so the minor version matches. One collection (`_docs`), one layout, and nine experiments, each read from the built `_site/`. Not run here: a real Pages deployment. Everything below is the local build, except where marked.

## Results

| Question | Result |
| --- | --- |
| Can a layout or a Liquid loop get a page's Markdown source? | **No.** `page.content` in a layout, and `doc.content` over `site.docs`, are the *converted HTML*. An aggregate `llms-full.txt` built from `site.docs` contains HTML |
| Can a page output its source with `include_relative`? | **Yes, with a stub.** A stub page `twin-intro.html` with `permalink: /docs/intro.md`, `layout: null`, and `{% include_relative _docs/intro.md %}` produced `_site/docs/intro.md` containing the source |
| Limits of that route | The path cannot contain `..` (error "File contains invalid characters"), so the stub must sit in an ancestor folder of the source. The source's front matter is included as text; a Liquid `split: "---"` removes it (tested). Liquid in the source is *evaluated*: `{{ 1 | plus: 2 }}` appeared as `3` in the twin |
| A `.md` page with front matter and `permalink: /x.md` | Converted to HTML under the `.md` name. This is a trap, not a twin |
| A file with **no** front matter | Copied verbatim (`plain.md`) *and* rendered to a page (`plain.html`), by `jekyll-optional-front-matter`. The title comes from the first heading; `defaults` scopes still apply (`lang` was set by folder) |
| `render_with_liquid: false` | **Ignored in Jekyll 3.10.** Liquid in Markdown content is still evaluated, which confirms the warning in ADR 0003 |
| `dir` in front matter | Works on a collection document (`page.dir` is `rtl`), but on a page, `page.dir` is Jekyll's directory path (`/raw/`), and a `defaults` value for `dir` is overridden. The name is unsafe |
| Pages without a `layout` | `jekyll-default-layout` gives them the theme's `default` layout. A plain-text page must say `layout: null` or it is wrapped in HTML |

Local builds of the Pages environment also need a UTF-8 locale (the default theme's stylesheet fails with `US-ASCII` otherwise) and a `repository` setting or `PAGES_REPO_NWO`, because `jekyll-github-metadata` runs on every build.

## Decision

1. **Classic Pages mode: one stub per page, generated.** The twin for `_docs/intro.md` is a stub page at the site root that sets `permalink` to the `.md` address, `layout: null`, and includes the source with `include_relative`, stripping its front matter. A script in the template (`npm run twins`) writes and updates the stubs from the collections; a check fails when a page has no stub or a stub is stale. The stubs are generated files, marked as such.
2. **Actions mode: a generator plugin writes the twins**, with no stubs, because custom plugins are allowed there. The twin is the exact source file bytes with front matter removed; Liquid is not evaluated.
3. **Content must not contain Liquid** (ADR 0003 rule 5, now backed by a test): `render_with_liquid: false` does not work on classic Pages, so a lint rejects `{{` and `{%` in Markdown bodies, which also keeps the twin identical to the source.
4. **The key is `direction`, not `dir`.** `direction: rtl | ltr` replaces `dir` in the front matter schema, in `defaults`, and in the layouts, which then print `dir="{{ page.direction }}"`.
5. **Files without front matter are an advanced option, not the default.** They need no stubs (the source is copied raw), but the title comes only from the first heading and there is no per-file description, language, or order. The docs mention it for sites that want zero overhead.
6. **Every twin is advertised** with `<link rel="alternate" type="text/markdown" href="...">` in the layout, and listed in `llms.txt`, so `readability.md-alternates` in Seaworthy can check them.

## Consequences

- A classic-mode site has one extra generated file per page. The check and the generated header make this safe; the alternative (no twins) fails the signature "agent-native" promise.
- Twins differ from HTML pages in one thing: they carry no layout, navigation, or includes. That is the point.
- **Not verified:** a real Pages deployment (whether the `.md` file is served, and with which `Content-Type`), Windows line endings in the source, large collections (build time with thousands of stubs), and the interaction with `jekyll-remote-theme`. Each is a check in `foundation.layout` or the template CI.
- ADR 0003 stays accepted; this ADR amends its key name only.
- **Amended when twins were built (#22):** "every page" means every page whose layout shows its content. Pages on a listing layout (`home`, `archive`, `tags`, `author`, `not-found`) get no twin, because their source is only an intro to what the layout lists, and Seaworthy rejects a twin that shares too few words with its page. The stubs are named `<name>.twin.html` and sit beside their source, or beside the underscore folder of a post or collection document.
