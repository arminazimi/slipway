# Roadmap: H1 (2026-10-18 → 2027-04-18)

> **Slipway** · *Build on Slipway. Ship Seaworthy.*
>
> Sites that agents can edit safely, and prove it. Slipway is two things: an editorial, right-to-left-ready theme for GitHub Pages that
> works on its own in any project, and an open spec for agent-editable sites with a checker, `slipway doctor`, that works on any static
> site generator. The theme is the spec's reference implementation. Free and open source.

## North star

Every agent that works on a static site knows where the content lives, how to change it, and how to check the change with one command,
because the site follows the agent-editable spec. When a person or an agent wants a site on GitHub Pages, Slipway is the theme they reach
for, and "agent-editable" is a level that sites on other generators reach too.

## Why Slipway

Research on 2026-10-18 found that GitHub Pages themes grow through forks (Minimal Mistakes has about 27,000), that the most-starred Jekyll themes
serve a niche (academic sites), and that agent features such as `llms.txt`, a skill file, and an MCP server come built in only with paid,
hosted documentation platforms. No free, open-source theme ships them. Slipway does, and adds what no one has:

1. **Source maps**: every finding points at the Markdown file and line an agent should edit, not the built HTML.
2. **"Edit with your agent"**: every section offers a prompt with its source file, line, and current text.
3. **An open spec and its checker**: what a site publishes so an agent can edit it safely, checked by `slipway doctor` on any generator.

Plus `AGENTS.md` in every site, content schemas, an Agent Skill and MCP server, content blocks, niche starters, and first-class right-to-left.

## Slipway and Seaworthy

Slipway 1.0 is standalone: nothing a site needs depends on [Seaworthy](https://github.com/arminazimi/seaworthy). The two answer different
questions. Seaworthy asks "is this site healthy and readable by agents?" (links, accessibility, agent readability). Slipway's spec asks
"can an agent edit this site safely?" (source maps, schemas, `AGENTS.md`, edit prompts). So `slipway doctor` leaves generic checks such as
links and alt text to Seaworthy.

Integration comes after 1.0, in Phase 6 (`1.1.0`). Slipway's own CI keeps running Seaworthy, pinned to a commit, as a regression net; sites
built with Slipway do not need it. The dependency still points one way: Slipway depends on Seaworthy, never the reverse. Seaworthy tracks
the same table in [docs/consumers/theme.md](https://github.com/arminazimi/seaworthy/blob/main/docs/consumers/theme.md).

| Slipway needs (Phase 6) | Seaworthy deliverable | Issue |
| --- | --- | --- |
| CI gate (`theme.action`, `agent.verified-gate`) | CLI, then Action | [#88](https://github.com/arminazimi/seaworthy/issues/88) |
| Install from npm instead of git | npm release | [#122](https://github.com/arminazimi/seaworthy/issues/122) |
| Badge (`seaworthy.badge`) | Badge endpoint | [#90](https://github.com/arminazimi/seaworthy/issues/90) |
| Findings on the Markdown line (`seaworthy.sourcemap`, `sourcemap.e2e`) | Source-map contract and reader | [#381](https://github.com/arminazimi/seaworthy/issues/381), [#197](https://github.com/arminazimi/seaworthy/issues/197) |
| MCP `verify` (`agent.mcp-verify`) | MCP `verify_site` | [#77](https://github.com/arminazimi/seaworthy/issues/77) |
| Starters verified both ways (`seaworthy.fixtures`) | Theme fixtures in Seaworthy CI | [#383](https://github.com/arminazimi/seaworthy/issues/383) |
| Co-launch (`launch.co-launch`) | Theme consumer task | [#354](https://github.com/arminazimi/seaworthy/issues/354) |
| Spec 1.0 (`spec.theme`) | Open spec and conformance levels | [#165](https://github.com/arminazimi/seaworthy/issues/165) |

**Timing.** Slipway's `sourcemap.json` format is written in Phase 2, close to Seaworthy's draft (`spec/source-map/v0`), so Seaworthy can read it
without a second format.

## Product principles

1. **Agent-editable, provably.** Every site says where its content lives and how to change it; every finding points at a source file and line.
2. **Verify, don't advise.** The output is a check that passes or fails, not a suggestion.
3. **Standalone and stable.** One line installs it; the public API follows semver and never breaks silently.
4. **Framework-neutral.** The spec and `slipway doctor` work on any static site generator; Jekyll is the first, not the only one.
5. **Right-to-left is first class.** Persian, Arabic, and Hebrew look designed, not mirrored.
6. **Small core, open edges.** New features arrive as blocks, presets, adapters, and starters.
7. **Works with Seaworthy, never requires it.**

## Phases

| Phase | Dates | Focus | Release |
|---|---|---|---|
| Phase 0 | 2026-10-18 → 2026-10-19 | Foundations and feasibility spikes | none |
| Phase 1 | 2026-10-20 → 2026-10-25 | Core theme | `0.1.0-alpha.1` |
| Phase 2 | 2026-10-26 → 2026-11-22 | Standalone theme and the spec | `0.2.0` |
| Phase 3 | 2026-11-23 → 2026-12-20 | Content and design | `0.3.0` |
| Phase 4 | 2026-12-21 → 2027-01-17 | Languages, ecosystems, and agents | `0.4.0` |
| Phase 5 | 2027-01-18 → 2027-02-14 | Proof, quality, and 1.0 | **`1.0.0`** |
| Phase 6 | 2027-02-15 → 2027-03-14 | Seaworthy integration | `1.1.0` |
| Phase 7 | 2027-03-15 → 2027-04-18 | Ecosystem: migration, community blocks, spec 1.0 | `1.2.0` + Spec 1.0 |

## Labels

Same system as Seaworthy: `roadmap`, `type: epic`/`task`, lanes (`strong-agent`, `free-agent`, `maintainer`), sizes (`XS`, `S`, `M`), and areas.
Issues transferred from Seaworthy keep their roadmap keys.

---

# Phase 0 — Foundations and feasibility spikes (2026-10-18 → 2026-10-19)

## Epic: Repository, CI, and contribution lanes
<!-- slipway-roadmap-key: E-foundation -->
> **Epic** · **Phase:** Phase 0 — Foundations and feasibility spikes (2026-10-18 → 2026-10-19)

### Outcome
A repository agents and humans can contribute to on day one, whose CI already runs Seaworthy on the example site.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `foundation.layout` | Theme gem layout that works three ways: `remote_theme`, the gem, and "Use this template" | strong-agent | S | none |
| `foundation.check` | `npm run check`: build the example sites with the GitHub Pages gem, run Seaworthy, validate schemas and the roadmap | strong-agent | S | `foundation.layout` |
| `foundation.ci` | CI on push and pull request with the GitHub Pages environment (Ruby, Jekyll, whitelisted plugins) | free-agent | S | `foundation.check` |
| `foundation.seaworthy-cli` | Run Seaworthy from git, pinned to a commit, until its npm release (Seaworthy issue #122) | free-agent | XS | `foundation.ci` |
| `foundation.agents-md` | `AGENTS.md` and `CLAUDE.md` for working on Slipway itself | strong-agent | S | `foundation.layout` |
| `foundation.contributing` | `CONTRIBUTING.md` with lanes, sizes, and the claim process | free-agent | XS | `foundation.agents-md` |
| `foundation.issue-gen` | Roadmap-to-issues tooling, ported from Seaworthy | strong-agent | M | none |
| `foundation.modes` | Document the two modes: GitHub Pages classic (no build step) and Actions mode (plugins allowed), and what each feature needs | strong-agent | S | `spike.md-twin-liquid`, `spike.source-map` |

### Exit criteria
- [x] `npm ci && npm run check` passes on a fresh clone, including a Seaworthy run on the example site.


## Epic: Feasibility spikes
<!-- slipway-roadmap-key: E-spikes -->
> **Epic** · **Phase:** Phase 0 — Foundations and feasibility spikes (2026-10-18 → 2026-10-19)

### Outcome
Answer the questions that decide the architecture before building on them. Each spike ends in an ADR.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `spike.md-twin-liquid` | Theme track: can plain GitHub Pages emit a raw Markdown twin per page? | strong-agent | M | none |
| `spike.persian-type` | Theme track: serif and sans fonts for Latin and Persian (license, size, rendering) | strong-agent | S | none |
| `spike.source-map` | Source maps: page-to-file is possible in Liquid (`page.path`); can section-to-line work in Pages classic, or only in Actions mode? | strong-agent | M | none |
| `spike.webmcp` | WebMCP: what the current draft needs, which browsers support it, and how to ship it behind a flag | strong-agent | S | none |
| `spike.content-model` | A framework-neutral content model (front matter, collections, navigation) so an Astro adapter can follow | strong-agent | M | none |

### Exit criteria
- [x] Each spike has an ADR with a decision and its consequences.


## Epic: Brand
<!-- slipway-roadmap-key: E-brand -->
> **Epic** · **Phase:** Phase 0 — Foundations and feasibility spikes (2026-10-18 → 2026-10-19)

### Outcome
Slipway's identity, in the same family as Seaworthy: "Build on Slipway. Ship Seaworthy."

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `brand.secure` | Register the GitHub org or repo name, npm scope, and a domain; run a trademark search | maintainer | S | none |
| `brand.mark` | Slipway mark in Seaworthy's visual family (shared palette, a ship on its ramp) | maintainer | M | none |
| `brand.kit` | Brand kit and generated assets, reusing Seaworthy's brand tooling | strong-agent | S | `brand.mark` |
| `brand.social` | Social preview, banner, and template thumbnail | free-agent | S | `brand.kit` |

### Exit criteria
- [ ] Name, org, and domain are registered.
- [ ] Brand assets are generated and checked in CI, like Seaworthy's.

---

# Phase 1 — Core theme (2026-10-20 → 2026-10-25)

## Epic: Theme design tokens and editorial type system
<!-- slipway-roadmap-key: E-theme-tokens -->
> **Epic** · **Phase:** Phase 1 — Core theme (2026-10-20 → 2026-10-25)

### Outcome
An editorial theme where every visual decision is a CSS custom property, restyled from `_config.yml` without editing CSS.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `theme.tokens` | Token scale (color, type, spacing) | strong-agent | M | `spike.persian-type` |
| `theme.dark` | Dark mode without flash, manual toggle | strong-agent | S | `theme.tokens` |
| `theme.config` | Map `_config.yml` tokens to CSS variables, with JSON Schema | strong-agent | S | `theme.tokens` |
| `theme.signature` | Editorial signature: display serif, numbered sections, hairline rules | strong-agent | S | `theme.tokens` |
| `theme.tokens-docs` | Document every token | free-agent | S | `theme.config` |
| `theme.contrast` | Every text token pair passes WCAG AA in light and dark, checked by a test | free-agent | S | `theme.dark` |
| `theme.print` | Print stylesheet | free-agent | XS | `theme.tokens` |

### Exit criteria
- [x] Changing three tokens restyles the demo site; all text tokens pass WCAG AA in light and dark.


## Epic: Theme layouts and RTL
<!-- slipway-roadmap-key: E-theme-layouts -->
> **Epic** · **Phase:** Phase 1 — Core theme (2026-10-20 → 2026-10-25)

### Outcome
Layouts for home, docs, posts, and pages, with right-to-left and multilingual support built in, not bolted on.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `theme.base` | Base layout: landmarks, skip link, toggle | strong-agent | S | `theme.tokens` |
| `theme.home` | `home` layout | strong-agent | S | `theme.base` |
| `theme.doc` | `doc` layout: sidebar nav, TOC, prev/next | strong-agent | M | `theme.base` |
| `theme.post` | `post` layout | free-agent | S | `theme.base` |
| `theme.page` | `page` layout | free-agent | XS | `theme.base` |
| `theme.code` | Code blocks and copy button | free-agent | S | `theme.base` |
| `theme.logical-css` | Logical CSS properties everywhere | free-agent | S | `theme.base` |
| `theme.i18n` | UI strings in `_data/i18n/`, `dir` from `lang`, language switcher | strong-agent | M | `theme.doc` |
| `theme.persian` | Persian type stack, digits, and Jalali dates (opt-in) | strong-agent | M | `theme.i18n` |
| `theme.search` | Client-side search | strong-agent | M | `theme.doc` |
| `theme.nav` | Navigation from `_data/navigation.yml`, validated by schema | free-agent | S | `theme.base` |
| `theme.taxonomies` | Tags, categories, and archive pages | free-agent | S | `theme.post` |
| `theme.feeds` | RSS/Atom feed and sitemap | free-agent | S | `theme.post` |
| `theme.not-found` | A real 404 page in every language | free-agent | XS | `theme.base` |
| `theme.zero-js` | JavaScript budget: none required to read a page; search and toggle under 10 KB, enforced in CI | strong-agent | S | `theme.search` |

### Exit criteria
- [x] Every example site (minimal, docs, blog, Persian) passes Seaworthy with zero findings.
- [x] Seaworthy dependencies are met: the Seaworthy CLI runs in CI (`foundation.seaworthy-cli`).

---

---

# Phase 2 — Standalone theme and the spec (2026-10-26 → 2026-11-22)

## Epic: Install anywhere, upgrade safely
<!-- slipway-roadmap-key: E-standalone -->
> **Epic** · **Phase:** Phase 2 — Standalone theme and the spec (2026-10-26 → 2026-11-22)

### Outcome
Any project adds Slipway with one line, pins a version, and upgrades without surprises: the public API is defined, versioned, and tested.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `standalone.zero-config` | A site with only `remote_theme` and a title builds and looks right; a new `examples/bare` proves it | strong-agent | S | `foundation.layout` |
| `standalone.stubs` | Cut the files every site must copy (feed, search index, sitemap, 404) to a minimum, shipped as one copyable folder | strong-agent | M | `standalone.zero-config` |
| `standalone.baseurl` | Project sites under `/<repo>/` and custom domains: every URL respects `baseurl`, tested in CI | free-agent | S | `standalone.zero-config` |
| `standalone.jekyll4` | Works on Jekyll 4 outside GitHub Pages (Netlify, Cloudflare Pages, plain `jekyll build`); CI matrix with 3.10 and 4.x | strong-agent | M | `foundation.ci` |
| `standalone.overrides` | Documented override slots (`head-custom.html`, `footer-custom.html`, `assets/css/custom.css`), no fork needed | free-agent | S | `theme.base` |
| `standalone.existing-site` | Guide: switch an existing Jekyll site to Slipway, keeping permalinks and mapping front matter | free-agent | S | `standalone.stubs` |
| `standalone.public-api` | ADR: the public API under semver (config keys, front matter, layouts, include names, CSS tokens) and the deprecation policy | strong-agent | S | none |
| `standalone.deprecations` | Build-time warnings for renamed config keys and front-matter fields, naming the replacement | strong-agent | S | `standalone.public-api` |
| `standalone.release` | Release workflow: version bump, `CHANGELOG.md`, tag, and GitHub release, so `remote_theme: arminazimi/slipway@v0.2.0` pins a version | strong-agent | S | `standalone.public-api` |
| `standalone.gem-publish` | Publish `slipway-theme` to RubyGems from the release workflow | maintainer | XS | `standalone.release` |
| `standalone.upgrade-test` | `UPGRADING.md` and a CI test that builds the previous release's examples with the current theme | strong-agent | S | `standalone.release` |

### Exit criteria
- [ ] A new repository with one `remote_theme` line pinned to a tag builds a complete site on GitHub Pages, and on Jekyll 4 elsewhere.
- [ ] Renaming a public config key fails no site: it warns and names the replacement.


## Epic: The agent-editable site spec and `slipway doctor`
<!-- slipway-roadmap-key: E-spec -->
> **Epic** · **Phase:** Phase 2 — Standalone theme and the spec (2026-10-26 → 2026-11-22)

### Outcome
An open spec says what a site publishes so an agent can edit it safely, and `slipway doctor` checks any static site against it, with findings on the source file and line and in formats agents and CI read.

### Scope
- The spec covers editing (source maps, schemas, `AGENTS.md`, edit prompts); readability and site health are Seaworthy's
- `slipway doctor` works on any generator; Jekyll and Slipway checks are one module of it

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `spec.editable` | Spec 0.1 "agent-editable site": what a site publishes so an agent can edit it safely (AGENTS.md, content schemas, `sourcemap.json`, agent-skills index, edit prompts) | strong-agent | M | `sourcemap.contract` |
| `spec.levels` | Conformance levels L0 to L3, with a machine-readable list of tests | strong-agent | S | `spec.editable` |
| `spec.site` | Publish the spec as a versioned site, with its JSON Schemas at stable URLs | free-agent | S | `spec.levels` |
| `spec.rfc` | RFC process for spec changes: template, review window, changelog | free-agent | XS | `spec.editable` |
| `spec.outreach` | Invite three theme maintainers to adopt the spec | maintainer | S | `spec.site` |
| `doctor.cli` | `npx slipway doctor <dir>`: check a source folder and its built output against the spec, for any generator | strong-agent | M | `spec.levels`, `schema.validate` |
| `doctor.detect` | Detect the generator (Jekyll, Hugo, Astro, Docusaurus, MkDocs, Eleventy) and its source and output folders | strong-agent | S | `doctor.cli` |
| `doctor.jekyll` | Jekyll and Slipway checks: required stubs, deprecated keys, no Liquid in content, translation pairs, UI strings | free-agent | S | `doctor.cli` |
| `doctor.rtl` | Right-to-left checks: `lang` and `dir` agree, mixed-direction titles are isolated | strong-agent | S | `doctor.cli` |
| `doctor.output` | JSON and SARIF output with file and line, for agents and GitHub code scanning | strong-agent | S | `doctor.cli` |
| `doctor.action` | GitHub Action that runs `slipway doctor` on any static site, with pull request annotations | free-agent | S | `doctor.output` |
| `doctor.badge` | Conformance badge showing the level a site reaches, produced by the Action | free-agent | S | `doctor.action` |
| `doctor.ci-recipes` | Recipes for GitLab CI, Netlify, Cloudflare Pages, Vercel, and pre-commit | free-agent | S | `doctor.cli` |
| `doctor.mcp` | `slipway doctor` as an MCP tool and an Agent Skill, so agents run it themselves | strong-agent | S | `doctor.output`, `agent.mcp-server` |
| `doctor.fix` | `--fix` for safe cases (missing stubs, deprecated keys), with a dry-run diff | strong-agent | M | `doctor.output`, `standalone.deprecations` |

### Exit criteria
- [ ] `npx slipway doctor` reports the conformance level of every example site and of one non-Jekyll fixture, with findings on source lines.
- [ ] The spec is published at a stable URL with its JSON Schemas.


## Epic: Content and config schemas
<!-- slipway-roadmap-key: E-schemas -->
> **Epic** · **Phase:** Phase 2 — Standalone theme and the spec (2026-10-26 → 2026-11-22)

### Outcome
Agents can create and edit content safely: every config key and every front-matter field is described by a JSON Schema and validated in CI.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `schema.config` | JSON Schema for Slipway's `_config.yml` keys | strong-agent | M | `theme.config` |
| `schema.front-matter` | JSON Schema for the front matter of each layout and collection | strong-agent | M | `theme.doc`, `theme.post` |
| `schema.validate` | CI step that validates every page's front matter and the config, with messages naming the file, key, and allowed values | free-agent | S | `schema.front-matter` |
| `schema.editor` | Editor autocomplete for config and front matter (YAML language server hints) | free-agent | S | `schema.config` |

### Exit criteria
- [ ] An invalid front-matter field fails CI with the file, the key, and the allowed values.


## Epic: Source maps
<!-- slipway-roadmap-key: E-source-map -->
> **Epic** · **Phase:** Phase 2 — Standalone theme and the spec (2026-10-26 → 2026-11-22)

### Outcome
Slipway's signature: every site publishes which source file and line produced each page and section, so `slipway doctor`, the edit button, and agents point at the Markdown file to edit, not at the built HTML.

### Scope
- Slipway owns the `sourcemap.json` format, kept close to Seaworthy's draft so Seaworthy can read it after 1.0

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `sourcemap.contract` | Define the `sourcemap.json` format (v0) with a JSON Schema, close to Seaworthy's `spec/source-map/v0` draft, and emit it | strong-agent | M | `spike.source-map` |
| `sourcemap.pages` | Page-to-file map in GitHub Pages classic, using Liquid's `page.path` | free-agent | S | `sourcemap.contract` |
| `sourcemap.lines` | Section-to-line map in Actions mode, through a small Jekyll plugin | strong-agent | M | `sourcemap.contract` |
| `sourcemap.docs` | Docs: how source maps work, what each mode supports, and how other themes can emit them | free-agent | S | `sourcemap.pages` |

### Exit criteria
- [ ] Every example site publishes a `sourcemap.json` that validates against its schema, and a `slipway doctor` finding names the Markdown file and line.


## Epic: Agent interface
<!-- slipway-roadmap-key: E-agent-interface -->
> **Epic** · **Phase:** Phase 2 — Standalone theme and the spec (2026-10-26 → 2026-11-22)

### Outcome
Agents build, edit, and check Slipway sites as first-class users: instructions travel with every site, and tools exist for every common change.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `agent.agents-md` | `AGENTS.md` inside every site created from the template: structure, schemas, commands, and the `slipway doctor` loop | strong-agent | S | `schema.validate` |
| `agent.skill-site` | Agent Skill: create a Slipway site and customize it | strong-agent | M | `agent.agents-md` |
| `agent.skill-content` | Agent Skill: write pages and posts that pass the schemas and `slipway doctor` | strong-agent | S | `agent.skill-site` |
| `agent.mcp-server` | MCP server skeleton for Slipway sites | strong-agent | M | `schema.config` |
| `agent.mcp-tools` | MCP tools: create page, set token, add navigation item, list layouts, preview | strong-agent | M | `agent.mcp-server` |
| `agent.create-cli` | `npx create-slipway`: new site from a starter, interactive or flags-only for agents | strong-agent | M | `foundation.layout` |
| `agent.edit-button` | "Edit with your agent" on every section: copies a prompt with the source file, line, and current text | strong-agent | M | `sourcemap.lines` |
| `agent.webmcp` | Experimental WebMCP tools in every site: search, page Markdown, and page list, off by default | strong-agent | M | `spike.webmcp`, `theme.search` |
| `agent.plugins` | Claude Code and Codex plugins bundling the Skills and the MCP server | strong-agent | S | `agent.skill-site`, `agent.mcp-tools` |

### Exit criteria
- [ ] A fresh agent session creates a Slipway site, adds a page, breaks a link, sees the finding on the Markdown line, fixes it, and gets a clean `slipway doctor` report.

---

# Phase 3 — Content and design (2026-11-23 → 2026-12-20)

## Epic: Content blocks
<!-- slipway-roadmap-key: E-blocks -->
> **Epic** · **Phase:** Phase 3 — Content and design (2026-11-23 → 2026-12-20)

### Outcome
A library of content blocks that work without JavaScript, look right in right-to-left, and have a schema each, so agents insert them without guessing.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `ext.blocks` | Block API: reusable content components with front-matter options and schemas | strong-agent | M | `schema.front-matter` |
| `block.callout` | Callout block: note, tip, warning, and danger, with icons that mirror correctly in RTL | free-agent | S | `ext.blocks` |
| `block.tabs` | Tabs block that reads as stacked sections without JavaScript | strong-agent | S | `ext.blocks` |
| `block.cards` | Card grid block for links and features | free-agent | S | `ext.blocks` |
| `block.figure` | Figure block: responsive image, caption, credit, `srcset`, lazy loading | free-agent | S | `ext.blocks` |
| `block.details` | Collapsible block on `<details>`, with FAQ JSON-LD | free-agent | S | `ext.blocks` |
| `block.steps` | Numbered steps block for tutorials | free-agent | XS | `ext.blocks` |
| `block.sidenotes` | Editorial sidenotes: footnotes become margin notes on wide screens | strong-agent | M | `ext.blocks` |
| `block.embed` | Privacy-friendly video embeds (YouTube, Vimeo, Aparat) that load only on click | free-agent | S | `ext.blocks` |
| `block.mermaid` | Mermaid diagrams, opt-in, loaded only on pages that use them | strong-agent | S | `ext.blocks` |
| `block.math` | Math with KaTeX, opt-in per page, with a no-JavaScript fallback | strong-agent | S | `ext.blocks` |
| `block.showcase` | Kitchen-sink page in the examples that renders every block in LTR and RTL | free-agent | S | `block.callout`, `block.tabs` |

### Exit criteria
- [ ] Every block renders in LTR and RTL with JavaScript off, and an invalid block option fails the schema check.


## Epic: Blogging and publishing
<!-- slipway-roadmap-key: E-publishing -->
> **Epic** · **Phase:** Phase 3 — Content and design (2026-11-23 → 2026-12-20)

### Outcome
Everything a real blog or publication needs, without plugins outside the GitHub Pages list.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `pub.seo` | SEO and social meta: canonical, Open Graph, Twitter cards, and `hreflang` alternates in `<head>` | strong-agent | S | `theme.base` |
| `pub.og-image` | Per-page social image, with a default generated from the title in Actions mode | strong-agent | M | `pub.seo` |
| `pub.authors` | Authors from `_data/authors.yml`: avatar, bio, links, author pages, several authors per post | free-agent | S | `theme.post` |
| `pub.series` | Post series: a series box and next and previous within the series | free-agent | S | `theme.post` |
| `pub.related` | Related posts by shared tags, computed in Liquid | free-agent | S | `theme.taxonomies` |
| `pub.post-toc` | Optional table of contents and reading progress on long posts | free-agent | S | `theme.post` |
| `pub.social` | Social links from `_data/social.yml` with an inline SVG icon set | free-agent | S | `theme.base` |
| `pub.comments` | Opt-in comments with giscus, themed for light, dark, and RTL | free-agent | S | `theme.post` |
| `pub.analytics` | Opt-in, privacy-friendly analytics (GoatCounter, Plausible, Umami) with one config key | free-agent | XS | `theme.base` |
| `pub.dates` | Drafts, scheduled posts, and an `updated` date shown as "edited on" | free-agent | S | `theme.post` |

### Exit criteria
- [ ] The blog example shares correctly on social networks and shows authors, series, and related posts.


## Epic: Design system and customization
<!-- slipway-roadmap-key: E-design -->
> **Epic** · **Phase:** Phase 3 — Content and design (2026-11-23 → 2026-12-20)

### Outcome
A site looks like its owner's, not like a theme demo, through config alone: variants, presets, logos, and palettes.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `ext.presets` | Theme presets as an extension point; five official presets | free-agent | S | `theme.config` |
| `design.header-variants` | Header variants (classic, centered, minimal), chosen in config | strong-agent | S | `theme.base` |
| `design.home-variants` | Home variants: editorial hero, landing page with features and a call to action, blog index, docs index | strong-agent | M | `theme.home` |
| `design.widths` | Page widths: narrow, wide, and full-bleed sections per page | free-agent | S | `theme.base` |
| `design.logo` | Logo and favicon from config: light and dark logo, SVG favicon, touch icon | free-agent | S | `theme.base` |
| `design.system-fonts` | System font mode: no font downloads, Persian still readable | free-agent | S | `theme.tokens` |
| `design.palette-tool` | `slipway palette <hex>`: derive a light and dark palette from one color that passes the contrast test | strong-agent | M | `theme.contrast` |
| `design.motion` | Motion tokens and `prefers-reduced-motion` everywhere | free-agent | XS | `theme.tokens` |
| `design.mobile-nav` | Mobile navigation drawer that works without JavaScript | strong-agent | S | `theme.nav` |
| `design.breadcrumbs` | Breadcrumbs for docs and nested pages, with BreadcrumbList JSON-LD | free-agent | S | `theme.doc` |
| `design.playground` | Playground page on the docs site: switch presets, palettes, and fonts live | strong-agent | M | `ext.presets`, `docs.site` |

### Exit criteria
- [ ] Five presets and three header variants restyle the example sites from `_config.yml` alone, and every combination passes the contrast test.


## Epic: Theme agent-readable output
<!-- slipway-roadmap-key: E-theme-ai -->
> **Epic** · **Phase:** Phase 3 — Content and design (2026-11-23 → 2026-12-20)

### Outcome
Every Slipway site is readable by agents out of the box: `llms.txt`, a Markdown twin of every page, and structured data.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `theme.llms-txt` | Generate `llms.txt` and `llms-full.txt` | free-agent | S | `theme.doc` |
| `theme.md-twin` | Markdown twin per page (mode per spike ADR) | strong-agent | M | `spike.md-twin-liquid` |
| `theme.jsonld` | JSON-LD per layout | free-agent | S | `theme.doc` |
| `theme.copy-button` | "Copy page as Markdown" button | free-agent | S | `theme.md-twin` |
| `theme.agent-skills-index` | Every site publishes `/.well-known/agent-skills/index.json` describing how to use and edit it | strong-agent | S | `theme.llms-txt` |
| `theme.negotiation-recipes` | Recipes for answering `Accept: text/markdown` with the twins on Netlify and Cloudflare Pages (`_headers`, `_redirects`) | free-agent | S | `theme.md-twin` |
| `theme.open-in-agent` | "Open in Claude" and "Open in ChatGPT" links that pass the page's Markdown URL | free-agent | S | `theme.md-twin` |

### Exit criteria
- [ ] Every example site publishes `llms.txt`, a Markdown twin of every page, and valid JSON-LD, checked by tests.

---

# Phase 4 — Languages, ecosystems, and agents (2026-12-21 → 2027-01-17)

## Epic: Multilingual and right-to-left excellence
<!-- slipway-roadmap-key: E-i18n -->
> **Epic** · **Phase:** Phase 4 — Languages, ecosystems, and agents (2026-12-21 → 2027-01-17)

### Outcome
The best right-to-left and multilingual support of any static theme: Persian, Arabic, and Hebrew look designed, and agents translate pages without breaking links.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `i18n.arabic` | Arabic: font stack, Arabic-Indic digits, and UI strings | strong-agent | M | `theme.persian` |
| `i18n.hebrew` | Hebrew: font stack and UI strings | free-agent | S | `theme.i18n` |
| `i18n.more-locales` | UI strings for ten more languages, one file each, contributed by pull request | free-agent | S | `theme.i18n` |
| `i18n.hijri` | Hijri calendar option for Arabic, next to Jalali | strong-agent | S | `i18n.arabic` |
| `i18n.bidi` | Bidi isolation for mixed-direction titles, code, numbers, and URLs | strong-agent | S | `theme.i18n` |
| `i18n.rtl-code` | Code blocks and tables inside RTL pages: direction, alignment, and copy are correct | free-agent | S | `theme.code` |
| `i18n.fallback` | Missing translation: a notice linking to the languages that exist, never a broken page | free-agent | S | `theme.i18n` |
| `i18n.search-normalize` | Search that normalizes Persian and Arabic (Yeh and Kaf variants, diacritics, ZWNJ) | strong-agent | S | `theme.search` |
| `i18n.translate-recipe` | Agent recipe: translate a page into another site language, keeping `translation_key` and links | strong-agent | S | `agent.agents-md` |
| `i18n.status-page` | Translation status page: which pages exist in which language | free-agent | S | `theme.i18n` |

### Exit criteria
- [ ] An Arabic and a Hebrew example site pass `slipway doctor` with no right-to-left findings, and search finds Persian words typed with Arabic letters.


## Epic: The spec beyond Jekyll
<!-- slipway-roadmap-key: E-adapters -->
> **Epic** · **Phase:** Phase 4 — Languages, ecosystems, and agents (2026-12-21 → 2027-01-17)

### Outcome
The agent-editable spec works outside Jekyll: adapters for the most used static site generators emit the same files, and `slipway doctor` checks them in CI.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `astro.adapter-design` | Design the Astro adapter on the framework-neutral content model | strong-agent | M | `spike.content-model` |
| `adapter.astro` | Astro integration that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | strong-agent | M | `spec.editable`, `astro.adapter-design` |
| `adapter.hugo` | Hugo module that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | strong-agent | M | `spec.editable` |
| `adapter.docusaurus` | Docusaurus plugin that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | strong-agent | M | `spec.editable` |
| `adapter.mkdocs` | MkDocs plugin that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | strong-agent | M | `spec.editable` |
| `adapter.eleventy` | Eleventy plugin that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | free-agent | S | `spec.editable` |
| `adapter.fixtures` | A fixture site per generator, checked by `slipway doctor` in CI | strong-agent | S | `doctor.detect`, `adapter.astro` |
| `adapter.css` | Slipway's tokens and CSS as a framework-neutral npm package | strong-agent | M | `theme.tokens` |
| `adapter.guide` | Guide: make any generator conform to the spec, level by level | free-agent | S | `adapter.astro`, `adapter.hugo` |
| `adapter.list` | Adapter list on the spec site, added by pull request | free-agent | XS | `spec.site` |

### Exit criteria
- [ ] Astro, Hugo, and Docusaurus fixture sites reach spec level L2 in `slipway doctor`.


## Epic: Discoverable by agents
<!-- slipway-roadmap-key: E-agent-reach -->
> **Epic** · **Phase:** Phase 4 — Languages, ecosystems, and agents (2026-12-21 → 2027-01-17)

### Outcome
An agent working on any static site finds Slipway's tools without searching: in the MCP Registry, the skill and plugin marketplaces, GitHub Marketplace, and agent documentation indexes.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `reach.mcp-npx` | `npx slipway mcp`: the MCP server runs with no install | strong-agent | S | `agent.mcp-server` |
| `reach.mcp-registry` | List the MCP server in the official MCP Registry | maintainer | XS | `reach.mcp-npx` |
| `reach.skills` | Publish the Agent Skills to skill directories and the Claude Code and Codex plugin marketplaces | maintainer | S | `agent.plugins` |
| `reach.action-marketplace` | Publish the doctor Action on GitHub Marketplace | maintainer | XS | `doctor.action` |
| `reach.docs-agents` | Slipway's docs publish `llms.txt` and Markdown twins and reach the top spec level | free-agent | S | `docs.site`, `theme.llms-txt` |
| `reach.snippet` | A copy-paste `AGENTS.md` snippet for any repository: "check the site with `slipway doctor`" | free-agent | XS | `doctor.cli` |
| `reach.prompts` | Prompt library: 20 common site tasks, each tested in the benchmark | strong-agent | S | `agent.skill-content` |
| `reach.webmcp-doctor` | WebMCP tool on Slipway sites that reports a page's source file and conformance level | strong-agent | S | `agent.webmcp`, `sourcemap.pages` |
| `reach.doc-indexes` | Docs indexed by agent documentation services, with a check that they stay current | maintainer | S | `docs.site` |

### Exit criteria
- [ ] The MCP server, the Skills, and the doctor Action are each listed in at least one public registry or marketplace.


## Epic: Documentation site and the 1.0 contract
<!-- slipway-roadmap-key: E-docs-site -->
> **Epic** · **Phase:** Phase 4 — Languages, ecosystems, and agents (2026-12-21 → 2027-01-17)

### Outcome
Slipway's own docs, built with Slipway, are the best demo and the reference for every public API item that 1.0 promises to keep.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `docs.site` | Slipway's docs site in `site/`, built with Slipway and deployed to Pages | strong-agent | M | `standalone.zero-config` |
| `docs.quickstart` | Getting started in five minutes, three ways (`remote_theme`, gem, template), each tested | free-agent | S | `docs.site`, `standalone.release` |
| `docs.config-ref` | Config reference generated from the JSON Schema, checked in CI so it never drifts | strong-agent | S | `schema.config`, `docs.site` |
| `docs.front-matter-ref` | Front-matter reference per layout, generated from the schemas | free-agent | S | `schema.front-matter`, `docs.site` |
| `docs.blocks-ref` | Block reference with live examples and copyable snippets | free-agent | S | `block.showcase`, `docs.site` |
| `docs.customize` | Customization guide: tokens, presets, override slots, custom CSS | free-agent | S | `standalone.overrides`, `docs.site` |
| `docs.rtl-guide` | Guide to multilingual and right-to-left sites | free-agent | S | `i18n.bidi`, `docs.site` |
| `docs.recipes` | Recipes: custom domain, analytics, comments, deploy to Netlify and Cloudflare Pages | free-agent | S | `docs.site` |
| `docs.persian` | The docs in Persian | strong-agent | M | `docs.quickstart` |
| `docs.v1-review` | 1.0 readiness review: every public API item documented, tested, and in `CHANGELOG.md` | maintainer | S | `standalone.public-api`, `docs.config-ref` |

### Exit criteria
- [ ] Every public API item named in the semver ADR has a reference page generated or checked in CI.

---

# Phase 5 — Proof, quality, and 1.0 (2027-01-18 → 2027-02-14)

## Epic: Accessibility, performance, and browsers
<!-- slipway-roadmap-key: E-quality -->
> **Epic** · **Phase:** Phase 5 — Proof, quality, and 1.0 (2027-01-18 → 2027-02-14)

### Outcome
The quality claims are tested, not stated: accessibility, performance, valid HTML, and every major browser, in light, dark, and RTL.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `perf.lighthouse` | Lighthouse 100 on every starter, enforced in CI | strong-agent | S | `theme.zero-js` |
| `launch2.visual-tests` | Screenshot tests: light, dark, RTL at three widths | strong-agent | M | `theme.persian` |
| `qa.axe` | Automated accessibility tests (axe) on every example page, in light, dark, and RTL | strong-agent | S | `foundation.ci` |
| `qa.keyboard` | Keyboard and screen-reader pass: focus order, visible focus, landmarks, a live region for search | strong-agent | S | `qa.axe` |
| `qa.html-validate` | Valid HTML on every example page, checked in CI | free-agent | S | `foundation.ci` |
| `qa.css-budget` | CSS size budget, enforced in CI like the JavaScript budget | free-agent | XS | `theme.zero-js` |
| `qa.font-subset` | Font subsets and `unicode-range`, so a page downloads only the scripts it uses | strong-agent | S | `theme.persian` |
| `qa.browsers` | Cross-browser tests in Chromium, Firefox, and WebKit with Playwright | strong-agent | S | `launch2.visual-tests` |
| `qa.stress` | Stress fixtures: very long titles, wide tables, deep navigation, 1,000 posts, mixed scripts | free-agent | S | `foundation.check` |
| `qa.build-time` | Build-time budget for a 1,000-post site on the Pages gem | free-agent | S | `qa.stress` |
| `qa.no-js` | Every example page tested with JavaScript off: content, navigation, and the search fallback work | free-agent | S | `theme.zero-js` |
| `qa.csp` | A Content Security Policy that works with the theme, and a security-headers recipe | strong-agent | S | `theme.base` |

### Exit criteria
- [ ] Every example and starter has zero axe violations, valid HTML, and Lighthouse 100, in three browsers, light and dark, LTR and RTL.


## Epic: Proof, feedback, and growth
<!-- slipway-roadmap-key: E-growth -->
> **Epic** · **Phase:** Phase 5 — Proof, quality, and 1.0 (2027-01-18 → 2027-02-14)

### Outcome
Public evidence that Slipway helps agents, real users and their feedback before 1.0, measured installs, and a business model that keeps the core free.

### Scope
- `growth.dogfood`, `growth.feedback`, and `growth.business` have no dependencies and start in Phase 2

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `growth.benchmark` | Public benchmark: agents do 20 edit tasks on Slipway and on three popular themes; success rate, tokens, and time; rerunnable in CI | strong-agent | M | `agent.skill-content`, `doctor.output` |
| `growth.benchmark-page` | Benchmark results page, updated on every release | free-agent | S | `growth.benchmark`, `docs.site` |
| `growth.demo` | One-minute demo on the README and the docs home: an agent edits a site, doctor catches a mistake, the agent fixes it | maintainer | S | `agent.edit-button`, `doctor.cli` |
| `growth.dogfood` | Move two of the maintainer's own projects to Slipway and file every friction as an issue | maintainer | M | none |
| `growth.early-users` | Five early users (Persian and Arabic developers, docs authors), each with written feedback | maintainer | M | `docs.quickstart` |
| `growth.feedback` | GitHub Discussions, issue forms (bug, showcase, idea), and a "was this helpful" on docs with no tracking | free-agent | S | none |
| `growth.install-metrics` | Weekly install numbers in the repository: gem and npm downloads, template uses, dependents, Action uses | strong-agent | S | `standalone.release` |
| `growth.showcase` | Showcase of real sites, added by pull request, each with its conformance badge | free-agent | S | `doctor.badge` |
| `growth.content-plan` | Content plan: one post per feature in Persian and English, shared in developer communities | strong-agent | S | `docs.site` |
| `growth.comparison` | Honest comparison pages: Slipway against Minimal Mistakes, Just the Docs, Chirpy, and hosted docs platforms | free-agent | S | `growth.benchmark` |
| `growth.business` | ADR: business model (sponsors, paid starters, hosted doctor for teams, support) and what stays free forever | maintainer | S | none |
| `growth.sponsors` | GitHub Sponsors and a funding file | maintainer | XS | `growth.business` |

### Exit criteria
- [ ] The benchmark is public and rerunnable, five early users have sent written feedback, and install numbers are published weekly.


## Epic: Starters
<!-- slipway-roadmap-key: E-starters -->
> **Epic** · **Phase:** Phase 5 — Proof, quality, and 1.0 (2027-01-18 → 2027-02-14)

### Outcome
Ready-made sites for the niches that grow theme ecosystems (the most-starred Jekyll themes are academic sites), each at the top spec level.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `starter.academic` | Academic starter: publications, CV, talks, teaching | strong-agent | M | `theme.post`, `schema.front-matter` |
| `starter.docs` | Documentation starter with versioned navigation | strong-agent | M | `theme.doc` |
| `starter.blog` | Blog starter | free-agent | S | `theme.post` |
| `starter.portfolio` | Portfolio starter | free-agent | S | `theme.home` |
| `starter.project` | Project homepage starter for open-source repositories | free-agent | S | `theme.home` |
| `starter.bilingual` | Bilingual Persian and English starter | strong-agent | S | `theme.persian` |
| `starter.gallery` | Gallery of starters and real sites on the docs site | free-agent | S | `starter.docs` |

### Exit criteria
- [ ] Every starter is a template repository, reaches the top level in `slipway doctor`, and passes the quality checks.


## Epic: Launch
<!-- slipway-roadmap-key: E-launch -->
> **Epic** · **Phase:** Phase 5 — Proof, quality, and 1.0 (2027-01-18 → 2027-02-14)

### Outcome
Slipway 1.0: a stable theme and an open spec, launched in English and Persian.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `launch2.template` | GitHub template repo, topics, social preview | maintainer | XS | `standalone.release` |
| `launch2.directories` | Submit to Jekyll theme directories | free-agent | S | `launch2.template` |
| `launch.readme` | README with a 30-second GIF of the edit-with-your-agent loop | strong-agent | S | `agent.edit-button` |
| `launch.posts` | Launch posts, including a Persian one | strong-agent | S | `launch.readme` |

### Exit criteria
- [ ] `1.0.0` published as a tag, a gem, and a template; 25 public sites built with Slipway show the conformance badge.

---

# Phase 6 — Seaworthy integration (2027-02-15 → 2027-03-14)

## Epic: Seaworthy integration
<!-- slipway-roadmap-key: E-seaworthy -->
> **Epic** · **Phase:** Phase 6 — Seaworthy integration (2027-02-15 → 2027-03-14)

### Outcome
"Build on Slipway. Ship Seaworthy.": Slipway sites can add Seaworthy's checks with one line, and Seaworthy's findings point at the Markdown line through Slipway's source maps.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `theme.action` | Template ships with the Seaworthy Action and badge, opt-in | free-agent | XS | `foundation.seaworthy-cli` |
| `agent.verified-gate` | Template CI option that blocks merges unless Seaworthy passes with zero errors | free-agent | S | `theme.action` |
| `agent.mcp-verify` | MCP `verify` tool that delegates to Seaworthy's MCP `verify_site` | free-agent | S | `agent.mcp-server` |
| `sourcemap.e2e` | End-to-end test: a broken link in a Markdown post is reported by Seaworthy at that post's line | strong-agent | S | `sourcemap.lines` |
| `seaworthy.doctor` | `slipway doctor` runs Seaworthy too when it is installed and merges the reports | strong-agent | S | `doctor.output` |
| `seaworthy.sourcemap` | Align `sourcemap.json` with Seaworthy's `spec/source-map` so Seaworthy reads it unchanged | strong-agent | S | `sourcemap.contract` |
| `seaworthy.badge` | The Seaworthy badge in the starters and on the docs site | free-agent | XS | `theme.action` |
| `seaworthy.fixtures` | The starters run as clean fixtures in Seaworthy's CI | strong-agent | S | `starter.docs` |
| `launch.demo-video` | Demo: an agent builds a site from a starter, Seaworthy catches a problem on the Markdown line, the agent fixes it | maintainer | M | `sourcemap.e2e` |
| `launch.co-launch` | Co-launch day with Seaworthy wave 2 | maintainer | M | `launch.posts` |

### Exit criteria
- [ ] A Seaworthy finding on a Slipway site points at the Markdown source and line, in Seaworthy's report and in GitHub annotations.
- [ ] Seaworthy dependencies are met: the Action ([#88](https://github.com/arminazimi/seaworthy/issues/88)), badge ([#90](https://github.com/arminazimi/seaworthy/issues/90)), MCP `verify_site` ([#77](https://github.com/arminazimi/seaworthy/issues/77)), source maps ([#381](https://github.com/arminazimi/seaworthy/issues/381), [#197](https://github.com/arminazimi/seaworthy/issues/197)), theme fixtures ([#383](https://github.com/arminazimi/seaworthy/issues/383)), and the theme consumer task ([#354](https://github.com/arminazimi/seaworthy/issues/354)).

---

# Phase 7 — Ecosystem: migration, community blocks, spec 1.0 (2027-03-15 → 2027-04-18)

## Epic: Extensions
<!-- slipway-roadmap-key: E-extensions -->
> **Epic** · **Phase:** Phase 7 — Ecosystem: migration, community blocks, spec 1.0 (2027-03-15 → 2027-04-18)

### Outcome
Slipway grows through community blocks and presets, not core changes.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `ext.community` | Community block and preset list, submitted by pull request | free-agent | S | `ext.blocks` |

### Exit criteria
- [ ] An external repository publishes a block that works in a Slipway site with one line of config.


## Epic: Migration
<!-- slipway-roadmap-key: E-migration -->
> **Epic** · **Phase:** Phase 7 — Ecosystem: migration, community blocks, spec 1.0 (2027-03-15 → 2027-04-18)

### Outcome
The fastest way into Slipway is from the themes people already use: an agent moves the site with one command.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `migrate.minimal-mistakes` | Migration from Minimal Mistakes | strong-agent | M | `schema.front-matter` |
| `migrate.just-the-docs` | Migration from Just the Docs | strong-agent | M | `schema.front-matter` |
| `migrate.al-folio` | Migration from al-folio | strong-agent | M | `starter.academic` |
| `migrate.chirpy` | Migration from Chirpy | strong-agent | M | `schema.front-matter` |
| `migrate.skill` | Agent Skill that runs a migration and checks the result with `slipway doctor` | strong-agent | S | `migrate.minimal-mistakes` |

### Exit criteria
- [ ] Each migration turns its theme's example site into a Slipway site that reaches the top level in `slipway doctor`.


## Epic: Spec 1.0
<!-- slipway-roadmap-key: E-standard -->
> **Epic** · **Phase:** Phase 7 — Ecosystem: migration, community blocks, spec 1.0 (2027-03-15 → 2027-04-18)

### Outcome
The agent-editable spec reaches 1.0 through RFCs, with conformance levels that Seaworthy also verifies.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `spec.theme` | Spec 1.0: the agent-editable site spec, verified by both `slipway doctor` and Seaworthy's conformance levels | strong-agent | M | `spec.rfc`, `seaworthy.doctor` |

### Exit criteria
- [ ] Spec 1.0 published; one theme or generator outside Slipway adopts it.
- [ ] Seaworthy dependencies are met: Seaworthy's open spec and conformance levels ([#165](https://github.com/arminazimi/seaworthy/issues/165)).

---

# Metrics

| Metric | 1.0 (end of Phase 5) | End of Phase 7 (month 6) | Month 12 target |
|---|---|---|---|
| Sites built with Slipway (forks, template uses, `remote_theme`) | 25 | 300 | 3,000 |
| Sites that pass `slipway doctor` at any level, on any generator | 50 | 500 | 5,000 |
| Generators with a conforming adapter | 3 | 5 | 8 |
| Weekly runs of the doctor Action | 100 | 1,000 | 10,000 |
| Benchmark: agent edit tasks done right, Slipway versus the next theme | published | +20 points | +30 points |
| Starters | 6 | 6 | 12 |
| Migrations from other themes | 0 | 4 | 8 |
| Themes or generators adopting the spec | 0 | 1 | 5 |

# After month 6

| Months | Focus |
|---|---|
| 7–8 | More adapters and community blocks; the spec through RFCs |
| 9–10 | Community starters; more migrations; a hosted doctor for teams, if the business ADR chose it |
| 11–12 | Second launch together with Seaworthy 1.0 |
