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

**Status:** the commands and plugins named below (`npm run twins`, `npm run sourcemap`, the generator and the lines plugin) are decided in the ADRs and not built yet; the tasks that build them are in [ROADMAP.md](../ROADMAP.md).

## What each feature needs

"Classic" means it works with no tooling. "Classic + command" means the author (or CI) runs a command and commits its output, so the site still deploys with no build step. "Actions" means it needs a build step.

| Feature | Classic | Classic + command | Actions | Source |
| --- | :---: | :---: | :---: | --- |
| Layouts, includes, CSS, `remote_theme`, the gem, "Use this template" | yes | | yes | [foundation.layout](../ROADMAP.md) |
| Override slots (`head-custom.html`, `footer-custom.html`, `custom.css`) | yes | | yes | [docs/overrides.md](overrides.md) |
| Right-to-left and `direction` in front matter | yes | | yes | [ADR 0006](adr/0006-markdown-twins.md) |
| Markdown twin of every page (the same address with `.md`) | | Stubs from `npm run twins` | A generator plugin, no stubs | [ADR 0006](adr/0006-markdown-twins.md) |
| Page-to-file source map (level 0) | yes, in Liquid | | yes | [ADR 0007](adr/0007-source-maps.md) |
| Section and link to exact line (levels 1 and 2) | | `npm run sourcemap` and a committed `sourcemap.json` | Generated at build, cannot go stale | [ADR 0007](adr/0007-source-maps.md) |
| Atom feed per language and a sitemap with `hreflang` | yes, in Liquid | | yes | [ROADMAP.md](../ROADMAP.md) |
| Verification with Seaworthy | In CI, not a gate on publishing | | In the workflow, before it deploys | [ROADMAP.md](../ROADMAP.md) |

Only rows with a decision record are filled in. The other planned features (search, feeds, sitemap, `llms.txt`, WebMCP, migration tools) are not placed in a column yet; each task adds its row when it lands.

## Limits to know

- **Classic mode cannot get a Markdown page's source from Liquid.** `page.content` is the converted HTML. That is why twins need a stub per page (ADR 0006).
- **Classic mode cannot compute exact lines in Liquid.** The result looks right in a demo and is wrong on real documents (ADR 0007). Level 0 says "this page comes from `_docs/intro.md`" and stops there.
- **Content must not contain Liquid** (`{{` or `{%`) in either mode. Classic Jekyll 3.10 ignores `render_with_liquid: false`, and the twin has to equal the source (ADR 0006).
- **A build on the Pages gem needs a UTF-8 locale and a `repository` setting** (or `PAGES_REPO_NWO`) locally, because `jekyll-github-metadata` runs on every build. `node tools/theme/build.mjs` sets both.
- **Not verified yet:** a real Pages deployment of any of this (whether the `.md` twins are served, and with which `Content-Type`), and the interaction of `remote_theme` with twins and source maps.

## How Slipway itself tests both

`npm run check` builds every site in `examples/` (minimal, docs, blog, persian) with the GitHub Pages gem as a gem theme and as a template, and runs Seaworthy on each build. CI does it in the Pages environment (Ruby from `.ruby-version`, `Gemfile.lock`). The `remote_theme` build needs network and a pushed theme, so it is opt-in: `SLIPWAY_TEST_REMOTE=1 node --test tools/theme/modes.test.mjs`.
