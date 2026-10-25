# The two modes

A Slipway site runs in one of two modes. They read the same files (the content model of [ADR 0003](adr/0003-content-model.md)); they differ in who builds the site.

| | **Classic** (GitHub Pages, no build step) | **Actions mode** (plugins allowed) |
| --- | --- | --- |
| Who builds | GitHub Pages, from the branch, with its own Jekyll | Your GitHub Actions workflow, then it deploys the result |
| Jekyll and plugins | The `github-pages` gem (Jekyll 3.10.0, kramdown 2.4.0) and its fixed list of plugins. No custom plugins | Any Jekyll and any plugin, including Slipway's own |
| What you set up | Fork, turn on Pages. Nothing else | Fork, turn on Pages with "GitHub Actions" as the source. The workflow will ship in the template (Phase 4) |
| What an author needs locally | Nothing. Ruby is optional, for the commands marked below | Nothing to write; Ruby only to preview |
| Pick it when | You want the site live with no moving parts | You want features that need code at build time |

The design is that you can start in classic mode and move to Actions mode later with no content or config changes, only the Pages source and the workflow. That is not tested yet.

**Status:** `npm run sourcemap` and the lines plugin (`_plugins/slipway_sourcemap.rb`), and `npm run twins` and the twins plugin (`_plugins/slipway_twins.rb`), are built.

## What each feature needs

"Classic" means it works with no tooling. "Classic + command" means the author (or CI) runs a command and commits its output, so the site still deploys with no build step. "Actions" means it needs a build step.

| Feature | Classic | Classic + command | Actions | Source |
| --- | :---: | :---: | :---: | --- |
| Layouts, includes, CSS, `remote_theme`, the gem, "Use this template" | yes | | yes | [foundation.layout](../ROADMAP.md) |
| Override slots (`head-custom.html`, `footer-custom.html`, `custom.css`) | yes | | yes | [docs/overrides.md](overrides.md) |
| Renamed config keys and front-matter fields keep working | yes, in Liquid (`compat.html`) | Warnings from `node tools/theme/deprecations.mjs <site>` | yes | [ADR 0012](adr/0012-public-api.md) |
| Right-to-left and `direction` in front matter | yes | | yes | [ADR 0006](adr/0006-markdown-twins.md) |
| Markdown twin of every page (the same address with `.md`), linked with `<link rel="alternate" type="text/markdown">`, see [Markdown twins](#markdown-twins) | | Stubs from `npm run twins` | A generator plugin, no stubs | [ADR 0006](adr/0006-markdown-twins.md) |
| Page-to-file source map (level 0): a `sourcemap.json` stub on the `sourcemap` layout | yes, in Liquid | | yes | [ADR 0007](adr/0007-source-maps.md) |
| Section and link to exact line (levels 1 and 2), see [source maps](source-maps.md) | | `npm run sourcemap` and a committed `sourcemap.json` | Generated at build, cannot go stale | [ADR 0007](adr/0007-source-maps.md) |
| "Edit with your agent" button on each section | The page's file, no line | The page's file, no line (the layouts cannot read a committed map) | File and line, from the plugin | [agent.edit-button](../ROADMAP.md) |
| Atom feed per language and a sitemap with `hreflang` | yes, in Liquid | | yes | [ROADMAP.md](../ROADMAP.md) |
| `llms.txt` and `llms-full.txt` (pages with `sitemap: false` are left out; `llms-full.txt` is text taken from the HTML, since Liquid cannot read the Markdown) | yes, in Liquid | | yes | [ROADMAP.md](../ROADMAP.md) |
| Authors from `_data/authors.yml`: byline, author box, and an author page per author (`layout: author`) | yes, in Liquid | | yes | [pub.authors](../ROADMAP.md) |
| Verification with Seaworthy | In CI, not a gate on publishing | | In the workflow, before it deploys | [ROADMAP.md](../ROADMAP.md) |

Only rows with a decision record are filled in. The other planned features (search, WebMCP, migration tools) are not placed in a column yet; each task adds its row when it lands.

## Limits to know

- **Classic mode cannot get a Markdown page's source from Liquid.** `page.content` is the converted HTML. That is why twins need a stub per page (ADR 0006).
- **Classic mode cannot compute exact lines in Liquid.** The result looks right in a demo and is wrong on real documents (ADR 0007). Level 0 says "this page comes from `_docs/intro.md`" and stops there.
- **Content must not contain Liquid** (`{{` or `{%`) in either mode. Classic Jekyll 3.10 ignores `render_with_liquid: false`, and the twin has to equal the source (ADR 0006).
- **A build on the Pages gem needs a UTF-8 locale and a `repository` setting** (or `PAGES_REPO_NWO`) locally, because `jekyll-github-metadata` runs on every build. `node tools/theme/build.mjs` sets both.
- **Not verified yet:** a real Pages deployment of any of this (whether the `.md` twins are served, and with which `Content-Type`), and the interaction of `remote_theme` with twins and source maps.

## Markdown twins

A page's twin is its Markdown source without the front matter, at the page's address with `.md`: `/about.html` has `/about.md`, and `/guide/install/` has `/guide/install/index.md`. Each page links its twin in the head with `<link rel="alternate" type="text/markdown">`.

- **Classic mode:** run `npm run twins -- <site>` (it needs Ruby and `bundle install`) and commit the stubs it writes. Each stub is a generated `.twin.html` page beside its source (`guide/install.twin.html`), or, for a post or a collection document, beside the underscore folder (`posts-2026-10-20-hello.twin.html`). Do not edit stubs; run the command again when a page is added, moved, or deleted. `npm run twins -- <site> --check` fails when a stub is missing, stale, or left over. Liquid in the source is evaluated in the twin, which is one more reason content must not contain it.
- **Actions mode:** `_plugins/slipway_twins.rb` writes every twin at build, from the source file's bytes, with no Liquid. It drops committed stubs, so a site can keep them when it moves from classic mode.
- Pages on a listing layout (`home`, `archive`, `tags`, `not-found`) get no twin: the layout writes most of the page, so the source would be a different document. Seaworthy's `readability.md-alternates` fails such a twin.
- A Markdown file with no front matter needs no twin: Jekyll copies it as is.
- The `bare` example has no stubs, so it has no twins; it proves a site needs only two files.

## How Slipway itself tests both

`npm run check` builds every site in `examples/` (minimal, docs, blog, persian) with the GitHub Pages gem as a gem theme and as a template, and runs Seaworthy on each build. CI does it in the Pages environment (Ruby from `.ruby-version`, `Gemfile.lock`). The `remote_theme` build needs network and a pushed theme, so it is opt-in: `SLIPWAY_TEST_REMOTE=1 node --test tools/theme/modes.test.mjs`.
