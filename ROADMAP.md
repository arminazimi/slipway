# Roadmap: v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31)

> **Slipway** · *Build on Slipway. Ship Seaworthy.*
>
> A documentation theme on its own TypeScript engine: docs that people find easy to read and agents can edit safely, with proof.

This file is the source of truth for planned work. `planning/roadmap/build.mjs` turns it and `planning/roadmap/briefs/` into GitHub issues;
`planning/roadmap/apply.mjs` syncs them. Each task is one issue and one pull request.

## Direction

Decided on 2026-11-06 (ADR 0021 records it):

1. **Docs first.** Slipway is a documentation theme. Evergreen's docs site is the first site and the benchmark. Blog, publishing, and
   marketing features are removed; generator adapters are frozen for later.
2. **Own engine.** A TypeScript engine (unified, Preact on the server, no client framework) replaces Jekyll. Hot paths may move to Rust later
   behind the same API. The engine knows nothing about the theme, so others can build on it.
3. **Theme, then standard.** First the theme reaches the acceptable level below and Evergreen moves to it; work on the agent-editable
   standard (spec, doctor on other generators) comes after 0.3.0.
4. **Jekyll is removed in 0.3.0.** The last Jekyll version stays on branch `legacy/jekyll` and tag `v0.2.0`.
5. **Mizzen and Lateen.** The engine is Mizzen (`@velella/mizzen`) and the theme is Lateen (`@velella/lateen`); after 0.3.0 they move to their
   own repositories under `velella-sh` (ADR 0025). Older tasks still say `slipway.yml`, `slipway build`, or `@slipway/*`: read them with the
   table in ADR 0025 (`mizzen.yml`, `mizzen build`, `@velella/mizzen`, `@velella/lateen`). Every task has `area: engine` or `area: theme`,
   which decides where its issue goes on the day of the split.

## Milestones

| Milestone | Dates | Focus | Release |
|---|---|---|---|
| v0.3.0 | 2026-11-09 → 2027-01-31 | Docs engine and theme | **0.3.0** |

The milestone closes when every epic's exit criteria are met, not on its date.

### The acceptable level (what 0.3.0 proves)

- Evergreen runs on the engine with every old URL working (E-evergreen).
- The design is approved against five reference docs sites, in light, dark, mobile, and right-to-left (E-design, E-layouts).
- Lighthouse at least 95 in all four categories, zero axe violations, under 30 KB of JavaScript per page, under 40 KB of CSS, and a
  600-page build under 10 seconds (E-quality).
- Source maps, Markdown twins, `llms.txt`, and `AGENTS.md` still work, and doctor reaches the level 0.2 sites reached (E-outputs, E-tooling).
- No Jekyll, Liquid, or Ruby is left in the repository (E-cleanup).

## Labels

`roadmap`, `type: epic` or `type: task` plus a kind (`type: engine`, `type: layout`, …), `lane:` (`strong-agent`, `free-agent`,
`maintainer`), `size:` (`XS` under an hour, `S` a few hours, `M` about a day), `priority:` (`P0` critical path to `P3` nice to have),
and `area:`. `status: ready` marks a task whose dependencies are all closed.

## Order, waves, and working twenty at a time

Every task issue shows three numbers:

- **Wave**: 1 + the deepest wave among its dependencies. Wave 1 tasks can start on day one.
- **Order**: its place in one global execution order (1 to 216): dependencies first, then priority, then position in this file.
- **Priority**: how much the release needs it.

Rules that let up to 20 tasks run at once and merge in any order (ADR 0023):

1. **One folder or file per unit.** Each output, Markdown plugin, layout, chrome part, component, token group, and gate has its own path.
2. **Registries discover units.** No task edits a shared index to register something.
3. **Contracts are frozen first.** `packages/engine/src/contracts/` is written in E-foundation and changes only through an ADR.
4. **Fixtures are read-only.** Tasks test against `fixtures/`; new content goes in a new fixture folder.
5. **Each brief lists the files it may create or edit.** Two tasks that edit the same file are chained by a dependency.
6. **Limits:** at most 20 tasks in progress, at most 4 per epic. Take the ready task with the lowest Order number first.

---

# v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31)

## Epic: Foundations and frozen contracts
<!-- slipway-roadmap-key: E-foundation -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P0

### Outcome
The decisions behind 0.3.0 are written down, `packages/engine` and `packages/theme` exist as workspaces that build and test, the engine's contracts (content model, config, plugin, output, and render types) are frozen, and a shared Evergreen-shaped fixture exists. After this epic, up to 20 tasks can run at once without touching the same files.

### Scope
- Four ADRs: docs-first, engine architecture, engine/theme boundary, site config
- Workspace scaffolds for the engine and the theme, wired into `npm run check`
- Frozen TypeScript contracts in `packages/engine/src/contracts/`
- Read-only fixtures in `fixtures/` that every other epic tests against

### Non-goals
- Any engine behavior beyond the scaffold and the types
- Any styling

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `adr.docs-first` | ADR 0021: Slipway is a docs-first theme on its own engine | strong-agent | S | P0 | none |
| `adr.engine` | ADR 0022: the engine is TypeScript on unified, rendered with Preact, Rust-ready | strong-agent | S | P0 | none |
| `adr.boundary` | ADR 0023: engine/theme boundary, folder-per-unit, and auto-discovery | strong-agent | S | P0 | `adr.engine` |
| `adr.config` | ADR 0024: `slipway.yml` site config and how `_config.yml` maps to it | strong-agent | S | P0 | `adr.engine` |
| `foundation.engine-package` | Scaffold `packages/engine`: workspace, TypeScript, tests, and check wiring | strong-agent | M | P0 | `adr.engine` |
| `foundation.theme-package` | Scaffold `packages/theme`: workspace and the empty registry folders | strong-agent | S | P0 | `foundation.engine-package`, `adr.boundary` |
| `foundation.contracts` | Freeze the engine contracts: content model, config, plugin, output, and render types | strong-agent | M | P0 | `foundation.engine-package`, `adr.boundary`, `adr.config` |
| `foundation.fixture` | Shared read-only fixtures: an Evergreen-shaped docs site and a Persian site | strong-agent | M | P0 | `adr.config` |

### Exit criteria
- [ ] ADRs 0021 to 0024 are merged with status Accepted.
- [ ] `npm run check` builds and tests both new workspaces with Node's built-in TypeScript support, with no separate compile step.
- [ ] Every type in `packages/engine/src/contracts/` has a doc comment, and the folder has a README that says it changes only through an ADR.
- [ ] `fixtures/docs-site/` holds about 600 pages in Evergreen's shape (hand-written pages, generated rule pages, an app page) and `fixtures/rtl-site/` holds a small Persian site; both are documented as read-only.
- [ ] AGENTS.md describes the new layout, the folder-per-unit rule, and auto-discovery, so a brief can name exactly the files it owns.

---

## Epic: Engine core
<!-- slipway-roadmap-key: E-engine -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P0

### Outcome
`slipway build` turns a folder of Markdown and a `slipway.yml` into a static site model and renders it with the theme, with source positions kept on every block, diagnostics that point at file and line, and a dev server. It builds `fixtures/docs-site` (about 600 pages) without errors.

### Scope
- Config loading and its JSON Schema
- Content discovery, front matter, titles, permalinks, data files, language and direction
- The Markdown pipeline and its plugins, HTML with source positions
- Navigation from YAML and from folders, the navigation tree, breadcrumbs, and pager data
- The site model, link checking, diagnostics, rendering, registries, CSS, islands, assets
- The build pipeline, cache, CLI, dev server, and the plugin API

### Non-goals
- Outputs other than the build loop itself (see E-outputs)
- Any theme markup or styles

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `engine.config-schema` | JSON Schema for `slipway.yml` | strong-agent | S | P0 | `foundation.contracts` |
| `engine.config-load` | Load and validate `slipway.yml` into `SiteConfig` | strong-agent | S | P0 | `engine.config-schema`, `engine.diagnostics` |
| `engine.diagnostics` | Diagnostics: one format with file and line, printed as text, JSON, or SARIF | strong-agent | S | P0 | `foundation.contracts` |
| `engine.diagnostic-fix` | ADR 0027 and contract: a `fix` suggestion on diagnostics that have a safe fix | strong-agent | S | P1 | `engine.diagnostics`, `adr.source-spans` |
| `engine.discover` | Discover content files, assets, and app-page folders | strong-agent | S | P0 | `foundation.contracts` |
| `engine.frontmatter` | Parse front matter with positions | strong-agent | S | P0 | `foundation.contracts` |
| `engine.markdown` | Markdown parser with positions and auto-discovered remark plugins | strong-agent | M | P0 | `foundation.contracts` |
| `engine.md-slug` | Stable heading IDs, safe for Persian and Arabic | strong-agent | S | P0 | `engine.markdown` |
| `engine.md-directives` | Container directives map to theme components | strong-agent | M | P0 | `engine.markdown` |
| `engine.md-code` | Code fence meta: title, line marks, diff, and tab groups | strong-agent | S | P0 | `engine.markdown` |
| `engine.md-links` | Rewrite links to `.md` files into page URLs | strong-agent | S | P1 | `engine.markdown`, `engine.permalink` |
| `engine.md-html` | Markdown to HTML with a source position on every block element | strong-agent | M | P0 | `engine.markdown` |
| `adr.source-spans` | ADR 0026: every block's source span has a start and an end line and column | strong-agent | S | P0 | `foundation.contracts` |
| `engine.source-spans` | Full source spans on every block, and a lookup from block ID to span | strong-agent | M | P0 | `adr.source-spans`, `engine.md-html`, `output.sourcemap` |
| `engine.title` | Page titles from front matter or the first heading, one `h1` | strong-agent | S | P1 | `engine.frontmatter`, `engine.md-html` |
| `engine.permalink` | URL rules: pretty URLs, `permalink`, index pages, base path | strong-agent | S | P0 | `foundation.contracts` |
| `engine.data` | Load `_data` files | free-agent | S | P1 | `foundation.contracts` |
| `engine.lang` | Language and direction per page | strong-agent | S | P1 | `foundation.contracts` |
| `engine.nav-yaml` | Navigation from `_data/navigation.yml` | strong-agent | S | P0 | `engine.data` |
| `engine.nav-folders` | Navigation from folders when there is no navigation file | strong-agent | S | P2 | `foundation.contracts` |
| `engine.nav-tree` | Navigation tree state: current page, active section, breadcrumb, pager | strong-agent | S | P0 | `foundation.contracts` |
| `engine.model` | Assemble the site model | strong-agent | M | P0 | `engine.discover`, `engine.frontmatter`, `engine.md-html`, `engine.title`, `engine.permalink`, `engine.lang`, `engine.nav-yaml`, `engine.nav-tree`, `engine.config-load` |
| `engine.links-check` | Check internal links and anchors in the model | strong-agent | S | P1 | `engine.model` |
| `engine.render` | Render pages with Preact on the server | strong-agent | M | P0 | `foundation.contracts` |
| `engine.registry` | Discover theme layouts, chrome, and components by folder | strong-agent | S | P0 | `foundation.contracts`, `foundation.theme-package` |
| `engine.assets` | Copy assets and pass app pages through untouched | strong-agent | S | P1 | `engine.discover` |
| `engine.css` | Bundle only the CSS a page uses | strong-agent | M | P1 | `engine.registry` |
| `engine.islands` | Ship client scripts only for components on the page | strong-agent | S | P1 | `engine.registry` |
| `engine.pipeline` | The build pipeline: model, render, outputs, write | strong-agent | M | P0 | `engine.model`, `engine.render`, `engine.registry`, `engine.assets`, `engine.diagnostics` |
| `engine.cache` | Incremental builds with a content-hash cache | strong-agent | M | P2 | `engine.pipeline` |
| `engine.cli` | `slipway build` and `slipway check` commands | strong-agent | S | P0 | `engine.pipeline` |
| `engine.dev` | `slipway dev`: watch, serve, and reload | strong-agent | M | P1 | `engine.cli` |
| `engine.plugins` | Public plugin API: content, model, and output hooks | strong-agent | M | P2 | `engine.pipeline` |

### Exit criteria
- [ ] `npx slipway build fixtures/docs-site` finishes with zero errors and writes the site.
- [ ] Every block element in the HTML carries its source file and line, checked by a test on `fixtures/docs-site`.
- [ ] A broken internal link or anchor fails the build with `file:line` in the message, and `--format json` and `--format sarif` print the same diagnostics.
- [ ] Pages without front matter get their title from the first heading and render one `h1`.
- [ ] `slipway dev` rebuilds a changed page in under 500 ms on `fixtures/docs-site`.
- [ ] `packages/engine` has no import from `packages/theme` and no Slipway name (checked by `quality.boundary`).
- [ ] Line coverage of `packages/engine/src` is at least 85%.

---

## Epic: Engine outputs: HTML, search, and agent-ready files
<!-- slipway-roadmap-key: E-outputs -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P1

### Outcome
From one site model, a build writes the HTML pages and every machine-readable file a docs site needs, all consistent with each other: sitemap, robots, 404, `llms.txt`, `llms-full.txt`, Markdown twins, a line-exact `sourcemap.json`, `AGENTS.md`, head metadata with JSON-LD, a Pagefind search index, redirects, and a build manifest. A site's own copies of these files win.

### Scope
- One file per output in `packages/engine/src/outputs/`, discovered by the pipeline
- Each output tested on `fixtures/docs-site`

### Non-goals
- Search UI (E-layouts)
- Social card images

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `output.html` | Write rendered pages as HTML with pretty URLs | strong-agent | S | P0 | `engine.model`, `engine.render` |
| `output.sitemap` | `sitemap.xml` | free-agent | S | P1 | `engine.model` |
| `output.robots` | `robots.txt` that points to the sitemap | free-agent | XS | P2 | `engine.model` |
| `output.not-found` | `404.html` at the site root | free-agent | XS | P2 | `output.html` |
| `output.llms` | `llms.txt`: the site's index for language models | strong-agent | S | P1 | `engine.model` |
| `output.llms-full` | `llms-full.txt`: every page's Markdown in one file | strong-agent | S | P1 | `engine.model` |
| `output.twins` | Markdown twin of every page | strong-agent | S | P1 | `engine.model` |
| `output.sourcemap` | Line-exact `sourcemap.json` | strong-agent | M | P0 | `engine.model` |
| `output.agents-md` | `AGENTS.md` for the built site | strong-agent | S | P1 | `engine.model` |
| `output.head-meta` | Head metadata: title, description, canonical, Open Graph, JSON-LD | strong-agent | S | P1 | `engine.model` |
| `output.search` | Pagefind search index | strong-agent | M | P0 | `output.html` |
| `output.site-files` | A site's own sitemap, llms files, and robots win | strong-agent | S | P1 | `output.sitemap`, `output.llms`, `output.llms-full`, `output.robots`, `engine.pipeline` |
| `output.app-pages` | Keep app pages out of search, llms files, twins, and the source map | strong-agent | S | P1 | `engine.assets` |
| `output.redirects` | Redirect pages from `redirects` and `redirect_from` | free-agent | S | P2 | `engine.model` |
| `output.manifest` | Build manifest for doctor and MCP | strong-agent | S | P1 | `engine.model` |
| `output.build-hash` | Build hash in the manifest, and `mizzen verify` to check a build against it | strong-agent | S | P1 | `output.manifest`, `engine.cli` |
| `output.page-json` | Per-page JSON for agents | strong-agent | S | P2 | `engine.model` |
| `output.feed` | Atom feed of changed pages | free-agent | S | P3 | `engine.model` |
| `output.pages-files` | GitHub Pages files: `.nojekyll` and `CNAME` | free-agent | XS | P1 | `engine.model` |

### Exit criteria
- [ ] A build of `fixtures/docs-site` writes every output in this epic, and turning one off in `slipway.yml` removes only that file.
- [ ] `sourcemap.json` validates against `schema/sourcemap.schema.json`, and every entry's line matches the `data-src` in the HTML (tested on all pages).
- [ ] Markdown twins, `llms.txt`, and `llms-full.txt` list the same pages, and app pages appear in none of them.
- [ ] Search finds a generated rule page by its title, and the index for 600 pages is under 1 MB before compression.
- [ ] Site-owned `sitemap.xml`, `llms.txt`, `llms-full.txt`, and `robots.txt` replace the generated ones with no warning.
- [ ] Every URL in `examples/product-docs/sitemap.xml` from 0.2 exists in the new output (tested).

---

## Epic: Design system
<!-- slipway-roadmap-key: E-design -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P0

### Outcome
Slipway has a new, docs-first design: a written brief based on Next.js, Tailwind, Stripe, Supabase, and Starlight docs; approved mockups of the home, guide, API, and mobile views; and tokens for color (light and dark), type, space, motion, states, code, and right-to-left, built into one CSS file, plus base prose styles.

### Scope
- `docs/design/` (brief, mockups, decisions)
- `packages/theme/tokens/`, `packages/theme/styles/`, `packages/theme/fonts/`, `packages/theme/icons/`

### Non-goals
- Layout and component markup (E-layouts, E-components)

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `design.brief` | Design brief: principles and what to take from five reference docs sites | strong-agent | M | P0 | none |
| `design.mockup-home` | Mockup: the docs home page | strong-agent | M | P0 | `design.brief` |
| `design.mockup-guide` | Mockup: a guide page | strong-agent | M | P0 | `design.brief` |
| `design.mockup-api` | Mockup: a reference page | strong-agent | M | P1 | `design.brief` |
| `design.mockup-mobile` | Mockup: the mobile views | strong-agent | M | P1 | `design.brief` |
| `design.review` | Approve the mockups and record the decisions | maintainer | S | P0 | `design.mockup-home`, `design.mockup-guide`, `design.mockup-api`, `design.mockup-mobile` |
| `design.tokens-pipeline` | Token pipeline: JSON groups to one CSS file | strong-agent | M | P0 | `foundation.theme-package` |
| `design.color-light` | Color tokens: light | strong-agent | S | P0 | `design.tokens-pipeline`, `design.review` |
| `design.color-dark` | Color tokens: dark | strong-agent | S | P0 | `design.tokens-pipeline`, `design.review` |
| `design.type` | Type tokens: scale, weights, line heights, measure | strong-agent | S | P0 | `design.tokens-pipeline`, `design.review` |
| `design.space` | Space, radius, shadow, layer, and breakpoint tokens | strong-agent | S | P0 | `design.tokens-pipeline`, `design.review` |
| `design.motion` | Motion tokens and reduced motion | free-agent | XS | P3 | `design.tokens-pipeline` |
| `design.states` | Interaction state tokens: focus, hover, selected, disabled | strong-agent | XS | P1 | `design.tokens-pipeline`, `design.review` |
| `design.code-light` | Code highlighting theme: light | strong-agent | S | P1 | `design.tokens-pipeline`, `design.review` |
| `design.code-dark` | Code highlighting theme: dark | strong-agent | S | P1 | `design.tokens-pipeline`, `design.review` |
| `design.fonts` | Self-hosted fonts: sans, mono, and Vazirmatn | strong-agent | S | P1 | `design.review`, `foundation.theme-package` |
| `design.icons` | Icon set for the chrome and components | free-agent | S | P1 | `design.review`, `foundation.theme-package` |
| `design.rtl` | Right-to-left tokens and styles | strong-agent | S | P1 | `design.type` |
| `design.base-css` | Base styles: reset and prose typography | strong-agent | M | P0 | `design.color-light`, `design.color-dark`, `design.type`, `design.space` |
| `design.brand` | Bring the brand palette in line with the new tokens | free-agent | S | P2 | `design.color-light`, `design.color-dark` |

### Exit criteria
- [ ] The maintainer approved the four mockups in `docs/design/decisions.md`.
- [ ] Every color pair used for text meets WCAG AA (4.5:1, 3:1 for large text and UI) in light and dark, checked in CI.
- [ ] No CSS in `packages/theme` uses a raw color, size, or font value outside the tokens (checked in CI).
- [ ] Body text is sans-serif, the measure is 65 to 80 characters, and the code font is monospaced with ligatures off.
- [ ] Persian pages use Vazirmatn with their own line height, and no letter spacing.
- [ ] The brand palette in `brand/` matches the new tokens.

---

## Epic: Doc layouts and page chrome
<!-- slipway-roadmap-key: E-layouts -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P1

### Outcome
A three-column docs layout (sidebar, article, on-this-page) with a sticky header, section tabs, collapsible sidebar groups, a mobile drawer, a table of contents that follows the reader, breadcrumbs, a pager, a page footer with edit links, a ⌘K search dialog, and a theme switch, plus home, 404, and app-page layouts. Everything works without JavaScript except search and the switches.

### Scope
- `packages/theme/layouts/*.ts`
- `packages/theme/chrome/<name>/` (index.ts, style.css, optional client.ts)

### Non-goals
- Components inside the article (E-components)

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `layout.base` | Base layout: document shell, head, skip link, landmarks | strong-agent | M | P0 | `foundation.contracts`, `design.tokens-pipeline`, `foundation.theme-package` |
| `layout.header` | Header: logo, section tabs slot, search button, theme switch, repository link | strong-agent | M | P0 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.section-tabs` | Section tabs for top-level navigation groups | strong-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.sidebar` | Sidebar: the navigation tree with the current page marked | strong-agent | M | P0 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.sidebar-collapse` | Collapsible sidebar groups | strong-agent | S | P1 | `layout.sidebar` |
| `layout.drawer` | Mobile navigation drawer | strong-agent | S | P0 | `layout.sidebar` |
| `layout.toc` | On this page: the table of contents | strong-agent | S | P0 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.scrollspy` | The table of contents follows the reader | free-agent | S | P1 | `layout.toc` |
| `layout.breadcrumb` | Breadcrumbs | free-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.pager` | Previous and next links | free-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.page-footer` | Page footer: last updated, edit source, edit with your agent, feedback | strong-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.block-actions` | Block actions: "Edit with your agent" on every block, with its exact source span | strong-agent | M | P0 | `engine.source-spans`, `layout.base` |
| `layout.page-agent-menu` | Page agent menu: copy or view the Markdown, open it in Claude, ChatGPT, or Cursor | strong-agent | S | P0 | `output.twins`, `layout.base` |
| `layout.calendar-dates` | "Last updated" in the Persian and Hijri calendars on Persian and Arabic pages | free-agent | S | P2 | `layout.page-footer` |
| `layout.search` | Search dialog | strong-agent | M | P0 | `foundation.contracts`, `design.tokens-pipeline`, `output.search` |
| `layout.search-shortcut` | Keyboard shortcuts for search: ⌘K, Ctrl+K, and / | free-agent | XS | P1 | `layout.search` |
| `layout.theme-toggle` | Light, dark, and system theme switch | free-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.site-footer` | Site footer | free-agent | XS | P2 | `foundation.contracts`, `design.tokens-pipeline` |
| `layout.doc` | Doc layout: three columns | strong-agent | M | P0 | `layout.base`, `layout.header`, `layout.sidebar`, `layout.drawer`, `layout.toc`, `layout.breadcrumb`, `layout.pager`, `layout.page-footer` |
| `layout.home` | Home layout: hero and cards | strong-agent | M | P1 | `layout.base`, `layout.header` |
| `layout.not-found` | 404 layout with search | free-agent | S | P2 | `layout.base`, `layout.header` |
| `layout.print` | Print styles | free-agent | S | P3 | `layout.doc` |
| `layout.ui-strings` | Interface strings in English, Persian, and Arabic | free-agent | S | P1 | `foundation.theme-package` |

### Exit criteria
- [ ] At 1440 px the doc layout shows three columns; at 1024 px two (no table of contents column); below 768 px one, with the drawer.
- [ ] Every chrome unit is reachable and usable by keyboard, with a visible focus ring.
- [ ] With JavaScript off, navigation, the sidebar, the table of contents, and the pager work.
- [ ] ⌘K and `/` open search; results appear in under 100 ms on `fixtures/docs-site` after the index loads.
- [ ] A rule page under the large `rules` section marks the section, and the sidebar stays under 50 links in the DOM.
- [ ] The layouts match the approved mockups (screenshots compared in the pull requests).

---

## Epic: Content components
<!-- slipway-roadmap-key: E-components -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P1

### Outcome
Authors have the components a docs site needs, written in Markdown: code blocks highlighted at build time with titles, line marks, diffs, copy buttons, and tabs that stay in sync across the page and site; terminals; callouts (GitHub alert syntax too); cards; steps; tables; file trees; details; figures; endpoints; schema tables; page status banners; heading anchors; and tabs. Each is one folder, styled only with tokens, and documented with an example in `fixtures/docs-site`.

### Scope
- `packages/theme/components/<name>/` (index.ts, style.css, optional client.ts, test)

### Non-goals
- Marketing blocks (pricing, testimonials, logos), which are removed in E-cleanup

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `component.code` | Code block highlighted at build time with Shiki | strong-agent | M | P0 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-code` |
| `component.code-copy` | Copy button on code blocks | free-agent | S | P0 | `component.code` |
| `component.code-title` | File name bar on code blocks | free-agent | XS | P1 | `component.code` |
| `component.code-lines` | Line highlighting and line numbers | strong-agent | S | P1 | `component.code` |
| `component.code-diff` | Inserted and deleted lines in code | strong-agent | S | P2 | `component.code-lines` |
| `component.code-tabs` | Code tabs: one block, several languages or files | strong-agent | M | P0 | `component.code` |
| `component.code-tabs-sync` | Code tabs stay in sync across the page and site | strong-agent | S | P1 | `component.code-tabs` |
| `component.terminal` | Terminal block: commands and output | strong-agent | S | P1 | `component.code` |
| `component.callout` | Callouts: note, tip, important, warning, caution | strong-agent | S | P0 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.cards` | Cards and card grids | strong-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.steps` | Numbered steps | free-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.table` | Tables: readable and scrollable | free-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline` |
| `component.kbd` | Keyboard keys | free-agent | XS | P3 | `foundation.contracts`, `design.tokens-pipeline` |
| `component.badge` | Badges | free-agent | XS | P2 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.file-tree` | File tree | strong-agent | S | P2 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.details` | Details and accordions | free-agent | XS | P2 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.figure` | Figures: captions and light/dark images | free-agent | S | P2 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.endpoint` | HTTP endpoint block | strong-agent | M | P2 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.schema-table` | JSON Schema as a property table | strong-agent | M | P2 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.page-status` | Page status banner: experimental, beta, deprecated | free-agent | S | P2 | `foundation.contracts`, `design.tokens-pipeline` |
| `component.heading-anchor` | Heading anchors | free-agent | S | P1 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-slug` |
| `component.tabs` | Content tabs | strong-agent | S | P2 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |
| `component.mermaid` | Mermaid diagrams rendered at build time | strong-agent | M | P3 | `foundation.contracts`, `design.tokens-pipeline` |
| `component.embed` | Video and iframe embeds | free-agent | S | P3 | `foundation.contracts`, `design.tokens-pipeline`, `engine.md-directives` |

### Exit criteria
- [ ] Every component renders the examples in `fixtures/docs-site` with no diagnostics.
- [ ] Code is highlighted at build time; a page with code but no tabs or copy buttons ships no JavaScript for code.
- [ ] Choosing a language in one code tab group switches every group on the page and is remembered on other pages.
- [ ] Every component works with JavaScript off (copy and tab sync excepted, which degrade to visible content).
- [ ] Every component passes axe with no violations and has a visible focus state where interactive.
- [ ] Every component is right-to-left correct (screenshot from `fixtures/rtl-site`).

---

## Epic: Quality gates
<!-- slipway-roadmap-key: E-quality -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P1

### Outcome
CI proves the acceptable-level criteria on every pull request: Lighthouse at least 95 in all four categories, zero axe violations, keyboard flows, JavaScript and CSS budgets, a build-time budget, visual regression, pages usable without JavaScript, valid HTML, no broken links, byte-identical builds, and an engine that knows nothing about the theme.

### Scope
- One folder per gate under `tools/<gate>/run.mjs`, discovered by `tools/check.mjs`
- Gates run on the engine's build of `fixtures/docs-site` and `fixtures/rtl-site`

### Non-goals
- Gates for the old Jekyll build (removed in E-cleanup)

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `quality.build-fixtures` | Shared fixture build for every gate | strong-agent | S | P0 | `engine.cli`, `foundation.fixture` |
| `quality.boundary` | Gate: the engine imports nothing from the theme | strong-agent | S | P0 | `foundation.engine-package` |
| `quality.deterministic` | Gate: two builds are byte-identical | strong-agent | S | P0 | `quality.build-fixtures` |
| `quality.twin-parity` | Gate: each page's Markdown twin has the same text as its HTML | strong-agent | S | P1 | `quality.build-fixtures`, `output.twins` |
| `quality.agent-ui` | Gate: block actions and the page agent menu work by keyboard and stay inside the JS budget | free-agent | S | P1 | `quality.keyboard`, `quality.js-budget`, `layout.block-actions`, `layout.page-agent-menu` |
| `quality.lighthouse` | Gate: Lighthouse at least 95 | strong-agent | M | P1 | `quality.build-fixtures`, `layout.doc`, `layout.home` |
| `quality.axe` | Gate: zero axe violations | strong-agent | S | P1 | `quality.build-fixtures`, `layout.doc`, `layout.home` |
| `quality.keyboard` | Gate: keyboard flows | strong-agent | M | P1 | `quality.build-fixtures`, `layout.doc`, `layout.search`, `layout.drawer`, `component.code-tabs` |
| `quality.js-budget` | Gate: JavaScript under 30 KB per page | free-agent | S | P1 | `quality.build-fixtures` |
| `quality.css-budget` | Gate: CSS under 40 KB | free-agent | S | P1 | `quality.build-fixtures` |
| `quality.build-time` | Gate: build under 10 seconds for 600 pages | strong-agent | S | P1 | `quality.build-fixtures` |
| `quality.visual` | Gate: visual regression | strong-agent | M | P1 | `quality.build-fixtures`, `layout.doc`, `layout.home` |
| `quality.nojs` | Gate: pages work without JavaScript | strong-agent | S | P1 | `quality.build-fixtures`, `layout.doc` |
| `quality.html-validate` | Gate: valid HTML | free-agent | XS | P2 | `quality.build-fixtures` |
| `quality.links` | Gate: no broken links or anchors | free-agent | XS | P1 | `quality.build-fixtures`, `engine.links-check` |
| `quality.rtl` | Gate: right-to-left pages | strong-agent | S | P2 | `quality.build-fixtures`, `layout.doc`, `design.rtl` |
| `quality.ci` | Run the browser gates in their own CI job | strong-agent | S | P1 | `quality.lighthouse`, `quality.axe`, `quality.keyboard`, `quality.visual`, `quality.nojs` |

### Exit criteria
- [ ] Every gate in this epic runs in CI on every pull request and fails the build when its threshold is missed.
- [ ] Lighthouse scores are at least 95 for Performance, Accessibility, Best Practices, and SEO on the home, a guide, a reference, and a rule page, on mobile settings.
- [ ] JavaScript per page is under 30 KB and CSS for the site under 40 KB, both compressed.
- [ ] A full build of `fixtures/docs-site` takes under 10 seconds on a GitHub-hosted runner.
- [ ] Two builds in a row produce byte-identical output.
- [ ] The visual baseline covers 4 pages × 3 widths × 2 themes, plus right-to-left.

---

## Epic: Tools off Jekyll: doctor, MCP, Skills, and setup
<!-- slipway-roadmap-key: E-tooling -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P1

### Outcome
`slipway doctor`, the MCP server, the Agent Skills, `create-slipway`, the GitHub Actions, and the release tool work with engine sites: they read `slipway.yml` and the build manifest, not `_config.yml` or Jekyll output, and none of them needs Ruby.

### Scope
- `packages/doctor`, `packages/mcp`, `packages/create-slipway`, `skills/`, `action/`, `tools/sourcemap`, `tools/twins`, `tools/release`

### Non-goals
- New doctor checks beyond porting
- Adapters for other generators (frozen)

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `tooling.doctor-engine` | doctor reads engine sites through the build manifest | strong-agent | M | P0 | `output.manifest`, `engine.config-load` |
| `tooling.doctor-config-checks` | Port config checks to `slipway.yml` | strong-agent | S | P1 | `tooling.doctor-engine`, `engine.config-schema` |
| `tooling.doctor-nav` | Port the navigation check | strong-agent | S | P1 | `tooling.doctor-engine` |
| `tooling.doctor-i18n` | Port language checks | free-agent | S | P2 | `tooling.doctor-engine` |
| `tooling.doctor-freshness` | Port twin, source map, and root-link checks | strong-agent | S | P1 | `tooling.doctor-engine`, `output.twins`, `output.sourcemap` |
| `tooling.doctor-new` | `slipway new` and `slipway stubs` make engine sites | strong-agent | S | P1 | `tooling.doctor-engine` |
| `tooling.doctor-info` | `info`, `pin`, and `translate` commands on engine sites | strong-agent | S | P2 | `tooling.doctor-engine` |
| `tooling.doctor-fix` | Port fixes, deprecations, and prose rules | strong-agent | S | P2 | `tooling.doctor-engine` |
| `tooling.sourcemap-tool` | Source map tool on the engine; remove the Ruby version | strong-agent | S | P1 | `output.sourcemap` |
| `tooling.twins-tool` | Twins tool on the engine; remove the Ruby version | free-agent | S | P1 | `output.twins` |
| `tooling.mcp-config` | MCP config and token tools on engine sites | strong-agent | S | P1 | `engine.config-load`, `design.tokens-pipeline` |
| `tooling.mcp-pages` | MCP page tools on engine sites | strong-agent | S | P1 | `engine.dev`, `output.redirects` |
| `tooling.mcp-edit-block` | MCP `edit_block`: edit one block by ID and prove that only its span changed | strong-agent | M | P0 | `engine.source-spans`, `tooling.mcp-pages` |
| `tooling.create-slipway` | `npm create slipway` makes an engine docs site | strong-agent | M | P0 | `engine.cli`, `tooling.action-deploy` |
| `tooling.action-deploy` | GitHub Action: build with the engine and deploy to Pages | strong-agent | M | P0 | `engine.cli` |
| `tooling.action-setup` | Setup Action without Ruby | free-agent | S | P1 | `tooling.action-deploy` |
| `tooling.skills-content` | Skills: content and site | strong-agent | S | P1 | `adr.config`, `engine.md-directives` |
| `tooling.skills-design` | Skills: design and components | strong-agent | S | P1 | `design.tokens-pipeline`, `component.callout` |
| `tooling.skills-ops` | Skills: deploy, doctor, translate, release notes | free-agent | S | P2 | `tooling.action-deploy`, `tooling.doctor-engine` |
| `tooling.release-tool` | Release tool publishes the engine and theme to npm | strong-agent | S | P1 | `foundation.engine-package`, `foundation.theme-package` |
| `tooling.agent-plugins` | Claude and Codex plugins point at the engine Skills and MCP server | free-agent | S | P2 | `tooling.skills-content`, `tooling.mcp-config` |

### Exit criteria
- [ ] `slipway doctor` on `fixtures/docs-site` reaches the same conformance level 0.2 sites reached, with no Jekyll code path left in `packages/doctor/src`.
- [ ] Every MCP tool works on an engine site (tested on `fixtures/docs-site`).
- [ ] `npm create slipway` makes a docs site that builds and deploys to GitHub Pages with the deploy Action, with no Ruby.
- [ ] Every Skill's instructions describe the engine (`slipway.yml`, components, `slipway build`), and none mentions `_config.yml` or `remote_theme`.
- [ ] `tools/release` publishes `@slipway/engine` and `@slipway/theme` to npm with provenance.

---

## Epic: Evergreen on the engine
<!-- slipway-roadmap-key: E-evergreen -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P0

### Outcome
Evergreen's docs site (arminazimi.github.io/evergreen) is built by the engine with the new theme, deployed by the deploy Action, with every old URL working, its 500+ generated rule pages and dashboard intact, its own `llms.txt` and sitemap kept, and doctor in its CI. A one-command migration tool exists for any Slipway 0.2 site.

### Scope
- Slipway-side: the migration tool, URL parity check, large sections, search at scale, subfolder sites, and `examples/product-docs` on the engine
- Evergreen-side: pull requests in arminazimi/evergreen to switch and to gate on doctor

### Non-goals
- Persian docs for Evergreen
- New Evergreen content

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `evergreen.example` | `examples/product-docs` builds with the engine | strong-agent | M | P0 | `engine.cli`, `layout.doc`, `output.search` |
| `evergreen.migrate-config` | Migration tool: `_config.yml` to `slipway.yml` | strong-agent | S | P0 | `engine.config-schema` |
| `evergreen.migrate-content` | Migration tool: front matter and navigation | strong-agent | S | P1 | `engine.nav-yaml`, `engine.permalink` |
| `evergreen.migrate-cli` | One command to migrate a Slipway 0.2 site | strong-agent | S | P1 | `evergreen.migrate-config`, `evergreen.migrate-content` |
| `evergreen.url-parity` | URL parity check against an old sitemap | strong-agent | S | P0 | `output.sitemap`, `output.redirects` |
| `evergreen.large-section` | Large generated sections stay fast and tidy | strong-agent | S | P0 | `layout.sidebar`, `engine.nav-tree` |
| `evergreen.search-scale` | Search on 600 pages: small index, loaded on first use | strong-agent | S | P1 | `output.search`, `layout.search` |
| `evergreen.subfolder` | Sites in a `docs/` folder: paths from the repository root | strong-agent | S | P1 | `output.sourcemap`, `layout.page-footer`, `foundation.fixture` |
| `evergreen.dashboard` | The dashboard app page passes through untouched | free-agent | XS | P1 | `output.app-pages`, `evergreen.example` |
| `evergreen.switch` | Switch Evergreen's docs to the engine | strong-agent | M | P0 | `evergreen.example`, `evergreen.migrate-cli`, `evergreen.url-parity`, `evergreen.large-section`, `evergreen.search-scale`, `evergreen.subfolder`, `evergreen.dashboard`, `tooling.action-deploy`, `quality.lighthouse` |
| `evergreen.doctor-gate` | Evergreen's CI runs doctor on the docs | strong-agent | S | P1 | `evergreen.switch`, `tooling.doctor-engine` |
| `evergreen.rollback` | Rollback plan and one week of watching | maintainer | XS | P1 | `evergreen.switch` |
| `evergreen.user-test` | Five tasks, three people | maintainer | S | P2 | `evergreen.switch` |
| `evergreen.canary` | Nightly canary: build Evergreen's docs with the engine | strong-agent | S | P1 | `evergreen.migrate-cli`, `engine.cli` |

### Exit criteria
- [ ] arminazimi.github.io/evergreen is served from an engine build, deployed by `action/deploy`.
- [ ] Every URL in Evergreen's last Jekyll `sitemap.xml` returns 200 or a redirect to its new URL (URL parity report attached to the switch pull request).
- [ ] The dashboard app page is byte-identical to before, and Evergreen's own `llms.txt` and sitemap are the ones served.
- [ ] Evergreen's CI runs doctor on every pull request and records its level.
- [ ] The site ran a week with no rollback, and the rollback steps to `v0.2.0` are written down.
- [ ] Three people completed five set tasks on the new site; results are recorded in the user-test issue.

---

## Epic: Slipway's own site on the engine
<!-- slipway-roadmap-key: E-site -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P2

### Outcome
Slipway's documentation site is built by the engine with the new theme and deployed by the deploy Action. Its content covers only the docs product: install, configure, write, components, customize, deploy, migrate from 0.2, and references generated from the schemas.

### Scope
- `site/` and `.github/workflows/deploy-site.yml`

### Non-goals
- Marketing pages, blog, comparison pages

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `site.config` | Build Slipway's site with the engine | strong-agent | S | P1 | `engine.cli`, `tooling.action-deploy` |
| `site.nav` | Docs-only navigation for Slipway's site | free-agent | XS | P2 | `site.config` |
| `site.home` | Slipway's home page | strong-agent | S | P2 | `site.config`, `layout.home`, `component.cards` |
| `site.a11y-report` | WCAG 2.2 AA conformance page built from the gate results | strong-agent | S | P2 | `quality.axe`, `quality.keyboard`, `site.config` |
| `site.perf-budget` | Performance budget page with the real numbers from the gates | free-agent | S | P2 | `quality.js-budget`, `quality.css-budget`, `quality.lighthouse`, `quality.build-time`, `site.config` |
| `site.guides` | Rewrite the guides for the engine | strong-agent | M | P2 | `site.config` |
| `site.components` | Component reference pages | strong-agent | M | P2 | `site.config`, `component.code-tabs`, `component.callout`, `component.cards` |
| `site.config-ref` | Generated config reference | strong-agent | S | P2 | `engine.config-schema`, `site.config` |
| `site.front-matter-ref` | Generated front matter reference | free-agent | S | P2 | `foundation.contracts`, `site.config` |
| `site.recipes` | Keep only docs recipes | free-agent | S | P3 | `site.config` |
| `site.spec-page` | Spec and llms pages on the engine | free-agent | XS | P3 | `site.config`, `output.site-files` |
| `site.trim` | Remove non-docs pages from Slipway's site | free-agent | S | P3 | `site.config` |

### Exit criteria
- [ ] The live Slipway site is an engine build deployed by `action/deploy`.
- [ ] The config and front matter references are generated from the engine schemas, and CI fails when they are stale.
- [ ] Every component has a reference page with a live example.
- [ ] No page mentions `remote_theme`, Liquid, or `_config.yml` except the migration guide.

---

## Epic: Remove Jekyll and everything that is not docs
<!-- slipway-roadmap-key: E-cleanup -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P2

### Outcome
The repository has one engine and one language: no Jekyll layouts, includes, plugins, Gemfiles, Ruby in CI, or `remote_theme` docs; no blog layouts, non-docs starters, examples, or marketing blocks. The last Jekyll version stays reachable through a tag and a branch for sites pinned to `v0.2.0`.

### Scope
- Deletions across the repository, each in its own pull request
- A check that keeps Jekyll from coming back

### Non-goals
- Removing `adapters/` (frozen for the standard phase)

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `cleanup.legacy-tag` | Keep the last Jekyll version reachable | maintainer | XS | P0 | none |
| `cleanup.tmp` | Delete `.tmp/` and `_site/` and ignore them | free-agent | XS | P1 | none |
| `cleanup.starters` | Remove non-docs starters | free-agent | S | P2 | `cleanup.legacy-tag`, `tooling.create-slipway` |
| `cleanup.examples` | Remove non-docs examples | free-agent | XS | P2 | `cleanup.legacy-tag`, `evergreen.example` |
| `cleanup.marketing-blocks` | Remove marketing and blog blocks | free-agent | S | P2 | `cleanup.legacy-tag` |
| `cleanup.blog-layouts` | Remove blog and publishing layouts | free-agent | S | P2 | `cleanup.legacy-tag` |
| `cleanup.jekyll-theme` | Remove the Jekyll theme files | strong-agent | S | P2 | `evergreen.switch`, `site.config`, `cleanup.marketing-blocks`, `cleanup.blog-layouts`, `cleanup.examples`, `cleanup.starters` |
| `cleanup.jekyll-plugins` | Remove Jekyll plugins | free-agent | XS | P2 | `cleanup.jekyll-theme`, `tooling.sourcemap-tool`, `tooling.twins-tool` |
| `cleanup.ruby` | Remove Ruby and the gem | free-agent | XS | P2 | `cleanup.jekyll-plugins` |
| `cleanup.jekyll-tests` | Remove the Jekyll theme tests | strong-agent | M | P2 | `cleanup.jekyll-theme` |
| `cleanup.jekyll-gates` | Remove gates that only ran on the Jekyll build | free-agent | S | P2 | `cleanup.jekyll-theme`, `quality.ci` |
| `cleanup.ci-ruby` | No Ruby in CI | strong-agent | S | P2 | `cleanup.ruby`, `cleanup.jekyll-tests`, `cleanup.jekyll-gates` |
| `cleanup.old-tokens` | Retire the old token files | strong-agent | S | P2 | `cleanup.jekyll-theme`, `design.base-css` |
| `cleanup.adapters-freeze` | Freeze `adapters/` for the standard phase | free-agent | XS | P3 | none |
| `cleanup.no-jekyll` | Gate: Jekyll does not come back | strong-agent | S | P1 | `cleanup.ci-ruby`, `cleanup.old-tokens` |

### Exit criteria
- [ ] Branch `legacy/jekyll` and tag `v0.2.0` point at the last Jekyll commit, and `remote_theme: arminazimi/slipway@v0.2.0` still builds.
- [ ] `_layouts/`, `_includes/`, `_plugins/`, `assets/`, `Gemfile`, `Gemfile.lock`, `slipway-theme.gemspec`, and `.ruby-version` are gone.
- [ ] Only the `docs` starter and the `docs` and `product-docs` examples remain, both on the engine.
- [ ] No workflow installs Ruby.
- [ ] `tools/no-jekyll` passes: no `jekyll`, `liquid`, `remote_theme`, or `.rb` outside ADRs, CHANGELOG, `adapters/`, and the migration tool.
- [ ] `npm run check` passes with no Ruby installed.

---

## Epic: Documentation and the 0.3.0 release
<!-- slipway-roadmap-key: E-release -->
> **Epic** · **Phase:** v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31) · **Priority:** P2

### Outcome
The repository's own documents describe the engine and the docs theme, users of 0.2 have a tested upgrade path, the changelog is clean, and `0.3.0` is released on GitHub and npm.

### Scope
- README, AGENTS, CLAUDE, CONTRIBUTING, UPGRADING, CHANGELOG, `docs/`, package READMEs
- The release itself

### Non-goals
- Launch posts and outreach

### Tasks
| Key | Task | Lane | Size | Priority | Depends |
|---|---|---|---|---|---|
| `release.agents` | AGENTS.md and CLAUDE.md for the new repository | strong-agent | S | P1 | `foundation.contracts`, `foundation.theme-package` |
| `release.readme` | README for 0.3.0 | strong-agent | S | P2 | `design.brand`, `tooling.create-slipway` |
| `release.contributing` | CONTRIBUTING.md for the new workflow | free-agent | S | P2 | `release.agents` |
| `release.upgrading` | Upgrade guide: 0.2 to 0.3 | strong-agent | S | P1 | `evergreen.migrate-cli` |
| `release.changelog-triage` | Sort the old changelog fragments | maintainer | XS | P2 | none |
| `release.engine-readme` | Engine README: API, CLI, plugins | strong-agent | M | P2 | `engine.plugins`, `engine.cli` |
| `release.theme-readme` | Theme README: tokens, layouts, components, overrides | strong-agent | S | P2 | `layout.doc`, `component.code` |
| `release.docs-folder` | Update or remove the documents in `docs/` | free-agent | M | P2 | `cleanup.jekyll-theme` |
| `release.notes` | Release notes for 0.3.0 | strong-agent | S | P2 | `release.changelog-triage`, `release.upgrading` |
| `release.publish` | Release 0.3.0 | maintainer | S | P1 | `release.notes`, `release.readme`, `release.agents`, `release.contributing`, `release.engine-readme`, `release.theme-readme`, `release.docs-folder`, `cleanup.no-jekyll`, `evergreen.rollback`, `quality.ci`, `site.components` |

### Exit criteria
- [ ] README, AGENTS.md, and CONTRIBUTING.md describe only the engine, the theme, and the new workflow.
- [ ] UPGRADING.md takes a 0.2 site to 0.3 with `slipway migrate`, tested on `examples/docs` from `legacy/jekyll`.
- [ ] The 25 fragments left from the old plan in `changelog.d/` are each kept, rewritten, or removed.
- [ ] `v0.3.0` is tagged, the GitHub release has notes, and `@slipway/engine` and `@slipway/theme` 0.3.0 are on npm with provenance.
- [ ] Every epic in this milestone is closed.

---
