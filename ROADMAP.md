# Roadmap: H1 (2026-11-02 → 2027-04-18)

> **Slipway** · *Build on Slipway. Ship Seaworthy.*
>
> An editorial, RTL-ready site template where every site is built for agents from day one: readable by them, editable by them,
> and verified by [Seaworthy](https://github.com/arminazimi/seaworthy) before it ships. Free and open source, on GitHub Pages.

## North star

By month 12, when a person or an agent wants a site on GitHub Pages, Slipway is the template they reach for, and "agent-native theme" is a spec
that other themes implement.

## Why Slipway

Research on 2026-10-18 found that GitHub Pages themes grow through forks (Minimal Mistakes has about 27,000), that the most-starred Jekyll themes
serve a niche (academic sites), and that agent features such as `llms.txt`, a skill file, and an MCP server come built in only with paid,
hosted documentation platforms. No free, open-source theme ships them. Slipway does, and adds what no one has:

1. **Source maps**: every finding points at the Markdown file and line an agent should edit, not the built HTML.
2. **"Edit with your agent"**: every section offers a prompt with its source file, line, and current text.
3. **WebMCP** (experimental): every site exposes search and page content as tools to browser agents.

Plus `AGENTS.md` in every site, content schemas, an Agent Skill and MCP server, niche starters, and one-command migration from popular themes.

## Depends on Seaworthy

The dependency points one way: Slipway depends on Seaworthy, never the reverse. Seaworthy tracks the same table in
[docs/consumers/theme.md](https://github.com/arminazimi/seaworthy/blob/main/docs/consumers/theme.md).

| Slipway needs | Seaworthy deliverable | Seaworthy phase | Issue |
| --- | --- | --- | --- |
| CI gate (`foundation.seaworthy-cli`, `agent.verified-gate`) | CLI, then Action | 1, 2 | [#88](https://github.com/arminazimi/seaworthy/issues/88) |
| Install from npm instead of git | npm release | 4 | [#122](https://github.com/arminazimi/seaworthy/issues/122) |
| Badge (`theme.action`) | Badge endpoint | 2 | [#90](https://github.com/arminazimi/seaworthy/issues/90) |
| Agent-readable output (`E-theme-ai`) | Agent-readability spec and checks | 1 | [#69](https://github.com/arminazimi/seaworthy/issues/69), [#220](https://github.com/arminazimi/seaworthy/issues/220) |
| Source maps (`E-source-map`) | Source-map contract and reader | 3 | [#381](https://github.com/arminazimi/seaworthy/issues/381), [#197](https://github.com/arminazimi/seaworthy/issues/197) |
| Edit with your agent (`agent.edit-button`) | Fix-prompt format | 2 | [#264](https://github.com/arminazimi/seaworthy/issues/264) |
| MCP `verify` (`agent.mcp-verify`) | MCP `verify_site` | 2 | [#77](https://github.com/arminazimi/seaworthy/issues/77) |
| WebMCP (`agent.webmcp`) | WebMCP check | 5 | [#382](https://github.com/arminazimi/seaworthy/issues/382) |
| Starters verified both ways (`E-starters`) | Theme fixtures in Seaworthy CI | 5 | [#383](https://github.com/arminazimi/seaworthy/issues/383) |
| Co-launch (`E-launch`) | Theme consumer task | 5 | [#354](https://github.com/arminazimi/seaworthy/issues/354) |

**Timing.** Until Seaworthy is on npm, Slipway installs it from git pinned to a commit. Source maps: Slipway writes the format in its Phase 2 and
Seaworthy reads it in its Phase 3, so the contract must be agreed first.

## Product principles

1. **Agent-native from day one.** Every site carries instructions, schemas, and machine-readable output; every common change has a tool.
2. **Verified, not claimed.** Every site passes Seaworthy in CI; a pull request that breaks it does not merge.
3. **Fork and go.** A fork is a live site on GitHub Pages with no build step. Power features use Actions mode.
4. **Right-to-left is first class.** Persian and Arabic look designed, not mirrored.
5. **Small core, open edges.** New features arrive as blocks, presets, and starters.
6. **Framework-neutral content.** Content and config do not depend on Jekyll, so an Astro adapter can follow.

## Phases

| Phase | Dates | Focus | Release |
|---|---|---|---|
| Phase 0 | 2026-11-02 → 2026-11-15 | Foundations and feasibility spikes | none |
| Phase 1 | 2026-11-16 → 2026-12-13 | Core theme | `0.1.0-alpha.1` |
| Phase 2 | 2026-12-14 → 2027-01-10 | Agent-native output and source maps | `0.1.0-alpha.2` |
| Phase 3 | 2027-01-11 → 2027-01-31 | Agent interface | `0.1.0-beta.1` |
| Phase 4 | 2027-02-01 → 2027-03-07 | Starters and launch (with Seaworthy wave 2) | **`0.1.0`** |
| Phase 5 | 2027-03-08 → 2027-04-18 | Ecosystem: blocks, migration, spec 0.9 | `0.2.0` + Spec 0.9 |

## Labels

Same system as Seaworthy: `roadmap`, `type: epic`/`task`, lanes (`strong-agent`, `free-agent`, `maintainer`), sizes (`XS`, `S`, `M`), and areas.
Issues transferred from Seaworthy keep their roadmap keys.

---

# Phase 0 — Foundations and feasibility spikes (2026-11-02 → 2026-11-15)

## Epic: Repository, CI, and contribution lanes
<!-- slipway-roadmap-key: E-foundation -->
> **Epic** · **Phase:** Phase 0 — Foundations and feasibility spikes (2026-11-02 → 2026-11-15)

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
> **Epic** · **Phase:** Phase 0 — Foundations and feasibility spikes (2026-11-02 → 2026-11-15)

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
> **Epic** · **Phase:** Phase 0 — Foundations and feasibility spikes (2026-11-02 → 2026-11-15)

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

# Phase 1 — Core theme (2026-11-16 → 2026-12-13)

## Epic: Theme design tokens and editorial type system
<!-- slipway-roadmap-key: E-theme-tokens -->
> **Epic** · **Phase:** Phase 1 — Core theme (2026-11-16 → 2026-12-13)

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
> **Epic** · **Phase:** Phase 1 — Core theme (2026-11-16 → 2026-12-13)

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
- [ ] Seaworthy dependencies are met: the Seaworthy CLI runs in CI (`foundation.seaworthy-cli`).

---

# Phase 2 — Agent-native output and source maps (2026-12-14 → 2027-01-10)

## Epic: Theme agent-readable output
<!-- slipway-roadmap-key: E-theme-ai -->
> **Epic** · **Phase:** Phase 2 — Agent-native output and source maps (2026-12-14 → 2027-01-10)

### Outcome
Every Slipway site is readable by agents out of the box, following Seaworthy's agent-readability spec.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `theme.llms-txt` | Generate `llms.txt` and `llms-full.txt` | free-agent | S | `theme.doc` |
| `theme.md-twin` | Markdown twin per page (mode per spike ADR) | strong-agent | M | `spike.md-twin-liquid` |
| `theme.jsonld` | JSON-LD per layout | free-agent | S | `theme.doc` |
| `theme.copy-button` | "Copy page as Markdown" button | free-agent | S | `theme.md-twin` |
| `theme.action` | Template ships with the Seaworthy Action and badge enabled | free-agent | XS | `foundation.seaworthy-cli` |
| `theme.agent-skills-index` | Every site publishes `/.well-known/agent-skills/index.json` describing how to use and edit it | strong-agent | S | `theme.llms-txt` |
| `theme.negotiation-recipes` | Recipes for answering `Accept: text/markdown` with the twins on Netlify and Cloudflare Pages (`_headers`, `_redirects`) | free-agent | S | `theme.md-twin` |
| `theme.open-in-agent` | "Open in Claude" and "Open in ChatGPT" links that pass the page's Markdown URL | free-agent | S | `theme.md-twin` |

### Exit criteria
- [ ] Every example site scores 100 on Seaworthy's agent-readability checks.
- [ ] Seaworthy dependencies are met: the agent-readability spec and checks ([#69](https://github.com/arminazimi/seaworthy/issues/69), [#70](https://github.com/arminazimi/seaworthy/issues/70), [#71](https://github.com/arminazimi/seaworthy/issues/71), [#72](https://github.com/arminazimi/seaworthy/issues/72), [#220](https://github.com/arminazimi/seaworthy/issues/220)).


## Epic: Source maps
<!-- slipway-roadmap-key: E-source-map -->
> **Epic** · **Phase:** Phase 2 — Agent-native output and source maps (2026-12-14 → 2027-01-10)

### Outcome
Slipway's signature: every site publishes which source file and line produced each page and section, so Seaworthy reports findings on the Markdown file an agent should edit, not on the built HTML.

### Scope
- The contract is Seaworthy's, so any theme or generator can emit it; Slipway is the first implementation

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `sourcemap.contract` | Emit the source-map file in the format of Seaworthy's contract (`spec/source-map/v0`) | strong-agent | M | `spike.source-map` |
| `sourcemap.pages` | Page-to-file map in GitHub Pages classic, using Liquid's `page.path` | free-agent | S | `sourcemap.contract` |
| `sourcemap.lines` | Section-to-line map in Actions mode, through a small Jekyll plugin | strong-agent | M | `sourcemap.contract` |
| `sourcemap.e2e` | End-to-end test: a broken link in a Markdown post is reported by Seaworthy at that post's line | strong-agent | S | `sourcemap.lines` |
| `sourcemap.docs` | Docs: how source maps work, what each mode supports, and how other themes can emit them | free-agent | S | `sourcemap.pages` |

### Exit criteria
- [ ] A finding on a Slipway site points at the Markdown source and line in Seaworthy's report and in GitHub annotations.
- [ ] Seaworthy dependencies are met: `spec.source-map` ([#381](https://github.com/arminazimi/seaworthy/issues/381)) and `int.source-map` ([#197](https://github.com/arminazimi/seaworthy/issues/197)).


## Epic: Content and config schemas
<!-- slipway-roadmap-key: E-schemas -->
> **Epic** · **Phase:** Phase 2 — Agent-native output and source maps (2026-12-14 → 2027-01-10)

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

---

# Phase 3 — Agent interface (2027-01-11 → 2027-01-31)

## Epic: Agent interface
<!-- slipway-roadmap-key: E-agent-interface -->
> **Epic** · **Phase:** Phase 3 — Agent interface (2027-01-11 → 2027-01-31)

### Outcome
Agents build, edit, and verify Slipway sites as first-class users: instructions travel with every site, and tools exist for every common change.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `agent.agents-md` | `AGENTS.md` inside every site created from the template: structure, schemas, commands, and the verify loop | strong-agent | S | `schema.validate` |
| `agent.skill-site` | Agent Skill: create a Slipway site and customize it | strong-agent | M | `agent.agents-md` |
| `agent.skill-content` | Agent Skill: write pages and posts that pass the schemas and Seaworthy | strong-agent | S | `agent.skill-site` |
| `agent.mcp-server` | MCP server skeleton for Slipway sites | strong-agent | M | `schema.config` |
| `agent.mcp-tools` | MCP tools: create page, set token, add navigation item, list layouts, preview | strong-agent | M | `agent.mcp-server` |
| `agent.mcp-verify` | MCP `verify` tool that delegates to Seaworthy's MCP `verify_site` | free-agent | S | `agent.mcp-server` |
| `agent.create-cli` | `npx create-slipway`: new site from a starter, interactive or flags-only for agents | strong-agent | M | `foundation.layout` |
| `agent.edit-button` | "Edit with your agent" on every section: copies a prompt with the source file, line, and current text | strong-agent | M | `sourcemap.lines` |
| `agent.webmcp` | Experimental WebMCP tools in every site: search, page Markdown, and page list, off by default | strong-agent | M | `spike.webmcp`, `theme.search` |
| `agent.verified-gate` | Template CI blocks merges unless Seaworthy passes with zero errors | free-agent | S | `theme.action` |
| `agent.plugins` | Claude Code and Codex plugins bundling the Skills and the MCP server | strong-agent | S | `agent.skill-site`, `agent.mcp-tools` |

### Exit criteria
- [ ] A fresh agent session creates a Slipway site, adds a page, breaks a link, sees the finding on the Markdown line, fixes it, and gets a clean Seaworthy report.
- [ ] Seaworthy dependencies are met: the Seaworthy Action ([#88](https://github.com/arminazimi/seaworthy/issues/88)), badge ([#90](https://github.com/arminazimi/seaworthy/issues/90)), MCP `verify_site` ([#77](https://github.com/arminazimi/seaworthy/issues/77)), and fix-prompt format ([#264](https://github.com/arminazimi/seaworthy/issues/264)).

---

# Phase 4 — Starters and launch (with Seaworthy wave 2) (2027-02-01 → 2027-03-07)

## Epic: Starters
<!-- slipway-roadmap-key: E-starters -->
> **Epic** · **Phase:** Phase 4 — Starters and launch (with Seaworthy wave 2) (2027-02-01 → 2027-03-07)

### Outcome
Ready-made sites for the niches that grow theme ecosystems (the most-starred Jekyll themes are academic sites), each passing Seaworthy at 100.

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
- [ ] Every starter is a template repository and passes Seaworthy with zero findings.
- [ ] Seaworthy dependencies are met: `int.theme-fixture` ([#383](https://github.com/arminazimi/seaworthy/issues/383)): the starters run as clean fixtures in Seaworthy's CI.


## Epic: Launch
<!-- slipway-roadmap-key: E-launch -->
> **Epic** · **Phase:** Phase 4 — Starters and launch (with Seaworthy wave 2) (2027-02-01 → 2027-03-07)

### Outcome
Launch together with Seaworthy's second wave: "Build on Slipway. Ship Seaworthy."

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `launch2.template` | GitHub template repo, topics, social preview | maintainer | XS | `theme.action` |
| `launch2.directories` | Submit to Jekyll theme directories | free-agent | S | `launch2.template` |
| `launch2.visual-tests` | Screenshot tests: light, dark, RTL at three widths | strong-agent | M | `theme.persian` |
| `launch.readme` | README with a 30-second GIF of the edit-with-your-agent loop | strong-agent | S | `agent.edit-button` |
| `launch.demo-video` | Demo: an agent builds a site from a starter, Seaworthy catches a problem on the Markdown line, the agent fixes it | maintainer | M | `sourcemap.e2e` |
| `launch.posts` | Launch posts, including a Persian one | strong-agent | S | `launch.readme` |
| `launch.co-launch` | Co-launch day with Seaworthy wave 2 | maintainer | M | `launch.posts` |

### Exit criteria
- [ ] `0.1.0` published; 25 public sites built with Slipway show the Seaworthy badge.
- [ ] Seaworthy dependencies are met: `launch2.theme-consumer` ([#354](https://github.com/arminazimi/seaworthy/issues/354)).

---

# Phase 5 — Ecosystem: blocks, migration, spec 0.9 (2027-03-08 → 2027-04-18)

## Epic: Extensions
<!-- slipway-roadmap-key: E-extensions -->
> **Epic** · **Phase:** Phase 5 — Ecosystem: blocks, migration, spec 0.9 (2027-03-08 → 2027-04-18)

### Outcome
Slipway grows through blocks and presets, not core changes.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `ext.presets` | Theme presets as an extension point; five official presets | free-agent | S | `theme.config` |
| `ext.blocks` | Block API: reusable content components with front-matter options and schemas | strong-agent | M | `schema.front-matter` |
| `ext.first-blocks` | First blocks: callouts, tabs, cards, Mermaid diagrams (one task each) | free-agent | S | `ext.blocks` |
| `ext.community` | Community block and preset list, submitted by pull request | free-agent | S | `ext.blocks` |

### Exit criteria
- [ ] An external repository publishes a block that works in a Slipway site with one line of config.


## Epic: Migration
<!-- slipway-roadmap-key: E-migration -->
> **Epic** · **Phase:** Phase 5 — Ecosystem: blocks, migration, spec 0.9 (2027-03-08 → 2027-04-18)

### Outcome
The fastest way into Slipway is from the themes people already use: an agent moves the site with one command.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `migrate.minimal-mistakes` | Migration from Minimal Mistakes | strong-agent | M | `schema.front-matter` |
| `migrate.just-the-docs` | Migration from Just the Docs | strong-agent | M | `schema.front-matter` |
| `migrate.al-folio` | Migration from al-folio | strong-agent | M | `starter.academic` |
| `migrate.chirpy` | Migration from Chirpy | strong-agent | M | `schema.front-matter` |
| `migrate.skill` | Agent Skill that runs a migration and verifies the result with Seaworthy | strong-agent | S | `migrate.minimal-mistakes` |

### Exit criteria
- [ ] Each migration turns its theme's example site into a Slipway site that passes Seaworthy.


## Epic: Performance and the theme spec
<!-- slipway-roadmap-key: E-standard -->
> **Epic** · **Phase:** Phase 5 — Ecosystem: blocks, migration, spec 0.9 (2027-03-08 → 2027-04-18)

### Outcome
Prove the claims, and turn Slipway's conventions into a spec other themes can adopt.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `perf.lighthouse` | Lighthouse 100 on every starter, enforced in CI | strong-agent | S | `theme.zero-js` |
| `spec.theme` | Spec 0.9: what makes a theme "agent-native" (output, source maps, schemas, AGENTS.md), verified by Seaworthy's conformance levels | strong-agent | M | `sourcemap.contract`, `agent.agents-md` |
| `spec.outreach` | Invite three theme maintainers to adopt the spec | maintainer | S | `spec.theme` |
| `astro.adapter-design` | Design the Astro adapter on the framework-neutral content model | strong-agent | M | `spike.content-model` |

### Exit criteria
- [ ] Spec 0.9 published; one theme outside Slipway adopts part of it.
- [ ] Seaworthy dependencies are met: Seaworthy's open spec and conformance levels ([#165](https://github.com/arminazimi/seaworthy/issues/165)).

---

# Metrics

| Metric | End of Phase 4 (launch) | End of Phase 5 (month 6) | Month 12 target |
|---|---|---|---|
| Sites built with Slipway (forks and template uses) | 25 | 300 | 3,000 |
| Sites showing the Seaworthy badge | 25 | 250 | 2,500 |
| Starters | 6 | 6 | 12 |
| Migrations from other themes | 0 | 4 | 8 |
| Themes adopting the agent-native spec | 0 | 1 | 5 |

# After month 6

| Months | Focus |
|---|---|
| 7–8 | Astro adapter; spec 1.0 through RFCs |
| 9–10 | Community starters and blocks; more migrations |
| 11–12 | Spec 1.0 final; second launch together with Seaworthy 1.0 |
