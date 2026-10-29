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

Integration comes after 1.0, in milestone v1.1 (`1.1.0`). Slipway's own CI keeps running Seaworthy, pinned to a commit, as a regression net; sites
built with Slipway do not need it. The dependency still points one way: Slipway depends on Seaworthy, never the reverse. Seaworthy tracks
the same table in [docs/consumers/theme.md](https://github.com/arminazimi/seaworthy/blob/main/docs/consumers/theme.md).

| Slipway needs (v1.1) | Seaworthy deliverable | Issue |
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

## Milestones

A milestone is a release. It closes when its exit criteria are met, not on its date; the dates are the plan, and only the next two are firm.
Every epic sits in exactly one milestone, and an epic that is not planned yet stays out of this file until it is. Phases 0, 1, and 2a are
finished and kept as history.

| Milestone | Dates | Focus | Release |
|---|---|---|---|
| Phase 0 | 2026-10-18 → 2026-10-19 | Foundations and feasibility spikes | none |
| Phase 1 | 2026-10-20 → 2026-10-25 | Core theme | `0.1.0-alpha.1` |
| Phase 2a | 2026-10-28 → 2026-11-15 | Parallel-safe contributions | none |
| v0.2 | 2026-10-26 → 2026-11-01 | Standalone theme, the spec, and Evergreen | `0.2.0` (Evergreen pins it) |
| v0.3 | 2026-10-30 → 2026-11-08 | Ready to scale | `0.3.0` |
| v0.4 | 2026-11-05 → 2026-11-22 | Docs platform | `0.4.0` |
| v0.5 | 2026-11-09 → 2026-12-06 | Agents everywhere | `0.5.0` |
| v0.6 | 2026-11-16 → 2026-12-20 | Content and languages | `0.6.0` |
| v1.0 | 2026-12-21 → 2027-01-17 | Proof, quality, and launch | **`1.0.0`** |
| v1.1 | 2027-01-18 → 2027-02-14 | Seaworthy integration | `1.1.0` |
| v1.2 | 2027-02-15 → 2027-03-14 | Ecosystem and spec 1.0 | `1.2.0` + Spec 1.0 |

## Labels

Same system as Seaworthy: `roadmap`, `type: epic`/`task`, lanes (`strong-agent`, `free-agent`, `maintainer`), sizes (`XS`, `S`, `M`), and areas.
Issues transferred from Seaworthy keep their roadmap keys.

## Working in parallel

Issues are written so that up to 15 agents (for example Jules sessions) can work at once, and their pull requests merge in any order.

1. **Wave 0 first.** The `E-parallel` epic in Phase 2a removes the shared files that make parallel pull requests conflict: changelog fragments, auto-discovered checks, one file per doctor check, MCP tool, and UI language. `parallel.merge-safe` goes first, alone.
2. **Then any ready task.** A task is ready when every task it depends on is closed. Two tasks that edit the same file are chained by a dependency, so any set of ready tasks can run together.
3. **Stay inside the brief.** Every brief lists the files the task may create or edit. Shared files (`CHANGELOG.md`, `package.json`, workflows, `ROADMAP.md`, `AGENTS.md`, `.gitignore`, the base layout, `<head>`, and `slipway.css`) are off limits unless the brief says otherwise.
4. **Scaffold first, then fan out.** Every epic added for v0.3 and later starts with one task that creates the shared structure (a registry, a layout, a folder convention); its other tasks depend only on it and touch only their own files. Run at most 15 agents at once and at most 3 per epic, so one bad scaffold stalls one epic, not the queue.
5. **Let the repository dispatch.** `E-agent-ops` (v0.3) labels ready tasks `status: ready` and hands them to Jules within those limits; `E-ci` (v0.3) adds the merge queue and the check that a pull request stays inside its brief.

`E-evergreen` (v0.2) holds only what [Evergreen](https://github.com/arminazimi/evergreen) needs to move its GitHub Pages site to Slipway.

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

# Phase 2a — Parallel-safe contributions (2026-10-28 → 2026-11-15)

## Epic: Parallel-safe contributions
<!-- slipway-roadmap-key: E-parallel -->
> **Epic** · **Phase:** Phase 2a — Parallel-safe contributions (2026-10-28 → 2026-11-15)

### Outcome
Fifteen agents (for example Jules sessions) can work on fifteen issues at once, and their pull requests merge in any order: no shared changelog, script list, registry, or string file forces a conflict.

### Scope
- Wave 0: these tasks run before the other epics fan out; `parallel.merge-safe` goes first, alone
- Repository tooling and docs only; no visible change to sites

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `parallel.merge-safe` | Remove shared-file merge conflicts: changelog fragments and an auto-discovered check runner | strong-agent | M | none |
| `parallel.jules-setup` | Agent environment setup script: Node, Ruby, the Pages gem, and Playwright in one command | free-agent | S | `parallel.merge-safe` |
| `parallel.tmp-root` | Tests write temporary sites under one ignored `.tmp/` folder | free-agent | S | `parallel.jules-setup` |
| `parallel.doctor-registry` | One file per `slipway doctor` check, discovered automatically | strong-agent | M | `parallel.merge-safe` |
| `parallel.mcp-registry` | One file per MCP tool, registered automatically | strong-agent | S | `parallel.merge-safe` |
| `parallel.i18n-split` | One UI-string file per language, and every right-to-left language code known up front | strong-agent | M | `parallel.merge-safe` |
| `parallel.css-components` | Component stylesheets: each new component ships its own CSS file, linked once by its include | strong-agent | S | `parallel.merge-safe` |
| `parallel.sorted` | Keep schema properties, UI strings, and navigation data sorted, checked by a test | free-agent | S | `parallel.i18n-split`, `evergreen.search-scale`, `evergreen.subfolder`, `evergreen.large-section` |
| `parallel.hot-files` | Hot-file guard: a list of shared files, and a check that warns when a pull request edits one | free-agent | S | `parallel.jules-setup` |
| `parallel.docs-autonav` | Docs site lists guides and recipes from their folders, so a new page edits no shared navigation | free-agent | S | `parallel.merge-safe` |

### Exit criteria
- [ ] Fifteen pull requests from ready issues, opened on the same day, merge in any order without a manual conflict fix.


---

# v0.2 — Standalone theme, the spec, and Evergreen (2026-10-26 → 2026-11-01)

## Epic: Install anywhere, upgrade safely
<!-- slipway-roadmap-key: E-standalone -->
> **Epic** · **Phase:** v0.2 — Standalone theme, the spec, and Evergreen (2026-10-26 → 2026-11-01)

### Outcome
Any project adds Slipway with one line, pins a version, and upgrades without surprises: the public API is defined, versioned, and tested.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `standalone.zero-config` | A site with only `remote_theme` and a title builds and looks right; a new `examples/bare` proves it | strong-agent | S | `foundation.layout` |
| `standalone.baseurl` | Project sites under `/<repo>/` and custom domains: every URL respects `baseurl`, tested in CI | free-agent | S | `standalone.zero-config` |
| `standalone.jekyll4` | Works on Jekyll 4 outside GitHub Pages (Netlify, Cloudflare Pages, plain `jekyll build`); CI matrix with 3.10 and 4.x | strong-agent | M | `foundation.ci` |
| `standalone.overrides` | Documented override slots (`head-custom.html`, `footer-custom.html`, `assets/css/custom.css`), no fork needed | free-agent | S | `theme.base` |
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
> **Epic** · **Phase:** v0.2 — Standalone theme, the spec, and Evergreen (2026-10-26 → 2026-11-01)

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
| `doctor.cli` | `npx slipway doctor <dir>`: check a source folder and its built output against the spec, for any generator | strong-agent | M | `spec.levels`, `schema.validate` |
| `doctor.detect` | Detect the generator (Jekyll, Hugo, Astro, Docusaurus, MkDocs, Eleventy) and its source and output folders | strong-agent | S | `doctor.cli` |
| `doctor.jekyll` | Jekyll and Slipway checks: required stubs, deprecated keys, no Liquid in content, translation pairs, UI strings | free-agent | S | `doctor.cli` |
| `doctor.rtl` | Right-to-left checks: `lang` and `dir` agree, mixed-direction titles are isolated | strong-agent | S | `doctor.cli` |
| `doctor.output` | JSON and SARIF output with file and line, for agents and GitHub code scanning | strong-agent | S | `doctor.cli` |
| `doctor.action` | GitHub Action that runs `slipway doctor` on any static site, with pull request annotations | free-agent | S | `doctor.output` |
| `doctor.mcp` | `slipway doctor` as an MCP tool and an Agent Skill, so agents run it themselves | strong-agent | S | `doctor.output`, `agent.mcp-server` |

### Exit criteria
- [ ] `npx slipway doctor` reports the conformance level of every example site and of one non-Jekyll fixture, with findings on source lines.
- [ ] The spec is published at a stable URL with its JSON Schemas.


## Epic: Content and config schemas
<!-- slipway-roadmap-key: E-schemas -->
> **Epic** · **Phase:** v0.2 — Standalone theme, the spec, and Evergreen (2026-10-26 → 2026-11-01)

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
> **Epic** · **Phase:** v0.2 — Standalone theme, the spec, and Evergreen (2026-10-26 → 2026-11-01)

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
> **Epic** · **Phase:** v0.2 — Standalone theme, the spec, and Evergreen (2026-10-26 → 2026-11-01)

### Outcome
Agents build, edit, and check Slipway sites as first-class users: instructions travel with every site, and tools exist for every common change.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `agent.agents-md` | `AGENTS.md` inside every site created from the template: structure, schemas, commands, and the `slipway doctor` loop | strong-agent | S | `schema.validate` |
| `agent.skill-site` | Agent Skill: create a Slipway site and customize it | strong-agent | M | `agent.agents-md` |
| `agent.skill-content` | Agent Skill: write pages and posts that pass the schemas and `slipway doctor` | strong-agent | S | `agent.skill-site` |
| `agent.mcp-server` | MCP server skeleton for Slipway sites | strong-agent | M | `schema.config` |
| `agent.create-cli` | `npx create-slipway`: new site from a starter, interactive or flags-only for agents | strong-agent | M | `foundation.layout` |
| `agent.edit-button` | "Edit with your agent" on every section: copies a prompt with the source file, line, and current text | strong-agent | M | `sourcemap.lines` |

### Exit criteria
- [ ] A fresh agent session creates a Slipway site, builds it locally, adds a page, introduces invalid front matter, sees a finding on the Markdown file and line, fixes it, and passes `slipway doctor . --build _site --level L2` (no failed MUST checks through L2). Broken content links at Markdown lines remain the v1.1 `sourcemap.e2e` criterion (#69), not a standalone Doctor guarantee.


## Epic: Evergreen's site on Slipway
<!-- slipway-roadmap-key: E-evergreen -->
> **Epic** · **Phase:** v0.2 — Standalone theme, the spec, and Evergreen (2026-10-26 → 2026-11-01)

### Outcome
Evergreen's GitHub Pages site (arminazimi.github.io/evergreen) runs on Slipway, pinned to a release: its hand-written pages without front matter, its 500+ generated rule pages, its dashboard, and its own `llms.txt` and sitemap all keep working at the same URLs, and Evergreen's CI checks the site with `slipway doctor`.

### Scope
- Only what Evergreen needs to switch; everything else waits for later phases
- Slipway-side tasks land here; `evergreen.switch` and `evergreen.doctor-gate` are pull requests in arminazimi/evergreen

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `evergreen.title-from-heading` | Pages without a `title` take it from their first heading and show one `h1`, not two | strong-agent | S | `parallel.merge-safe` |
| `standalone.stubs` | Cut the files every site must copy (feed, search index, sitemap, 404) to a minimum, shipped as one copyable folder | strong-agent | M | `standalone.zero-config`, `parallel.doctor-registry` |
| `evergreen.site-files` | A site's own `sitemap.xml`, `llms.txt`, `llms-full.txt`, and `robots.txt` replace Slipway's without a warning | strong-agent | S | `standalone.stubs`, `parallel.doctor-registry` |
| `evergreen.large-section` | Generated sections with hundreds of pages: the docs sidebar marks the section, not every page | strong-agent | S | `evergreen.title-from-heading` |
| `evergreen.search-scale` | Search stays fast on 600 pages: a smaller index, `search: false`, and an index that loads on first use | strong-agent | S | `parallel.merge-safe` |
| `evergreen.subfolder` | Sites in a repository subfolder (`docs/`): edit prompts name the path from the repository root | strong-agent | S | `parallel.merge-safe` |
| `evergreen.app-pages` | Static HTML apps (own CSS and JavaScript, no front matter) pass through untouched and stay out of search, `llms.txt`, and the source map | free-agent | S | `evergreen.search-scale` |
| `evergreen.fixture` | `examples/product-docs`: an example shaped like Evergreen's site, built and checked in CI | strong-agent | M | `evergreen.title-from-heading`, `evergreen.large-section`, `evergreen.site-files`, `evergreen.app-pages`, `evergreen.subfolder` |
| `evergreen.release` | Release `v0.2.0` so Evergreen can pin `remote_theme: arminazimi/slipway@v0.2.0` | maintainer | XS | `evergreen.fixture`, `standalone.stubs` |
| `evergreen.switch` | Switch arminazimi/evergreen's `docs/` site to Slipway, pinned to `v0.2.0` | strong-agent | M | `evergreen.release` |
| `evergreen.doctor-gate` | Evergreen's CI runs Slipway's doctor Action on `docs/` and records the level its site reaches | strong-agent | S | `evergreen.switch` |

### Exit criteria
- [ ] arminazimi.github.io/evergreen builds with `remote_theme: arminazimi/slipway@v0.2.0`, and every URL in its previous `sitemap.xml` still resolves.
- [ ] `examples/product-docs` reproduces Evergreen's shape and passes `npm run check`.


---

# v0.3 — Ready to scale (2026-10-30 → 2026-11-08)

## Epic: CI that scales to fifteen agents
<!-- slipway-roadmap-key: E-ci -->
> **Epic** · **Phase:** v0.3 — Ready to scale (2026-10-30 → 2026-11-08)

### Outcome
CI is fast, safe, and strict enough that fifteen agent pull requests a day merge without breaking `main`, and every pull request shows what it changed in size, levels, and pixels.

### Scope
- Each concern gets its own workflow file in `.github/workflows/`, so most tasks add a file instead of editing `ci.yml`; `ci.split` goes first
- `ci.merge-queue`, `ci.cache`, `ci.permissions`, and `ci.pin-sha` edit every workflow, so they run one after another

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `ci.split` | Split `ci.yml`: keep the build jobs behind one `ci-ok` job branch protection can require, move other concerns to their own workflows, and document how to add one | strong-agent | M | none |
| `ci.merge-queue` | Run every required workflow on `merge_group`, so the merge queue can batch agent pull requests | free-agent | XS | `ci.split` |
| `ci.merge-queue-on` | Turn on the merge queue for `main` and require `ci-ok` | maintainer | XS | `ci.merge-queue` |
| `ci.cache` | Cache the Ruby bundle, the Seaworthy build, and Playwright browsers, and print the check time in the job summary | strong-agent | S | `ci.merge-queue` |
| `ci.permissions` | Every workflow starts from `permissions: {}` and each job asks only for what it needs | free-agent | S | `ci.cache` |
| `ci.pin-sha` | Pin every third-party action to a full commit SHA with its version in a comment, and let Dependabot update them | free-agent | S | `ci.permissions` |
| `ci.workflow-lint` | `workflow-lint.yml`: actionlint and zizmor on every change to `.github/` and `action/` | free-agent | S | `ci.split` |
| `ci.codeql` | `codeql.yml`: CodeQL for the JavaScript in `packages/`, `tools/`, `action/`, and `assets/js/` | free-agent | XS | `ci.split` |
| `ci.pr-hygiene` | `pr-hygiene.yml`: a pull request needs `Closes #<issue>`, and a changelog fragment when it touches files a site owner sees | strong-agent | S | `ci.split` |
| `ci.scope` | `scope.yml`: fail when a pull request edits files its issue's brief does not list | strong-agent | M | `ci.split` |
| `ci.report` | `report.yml`: one sticky pull request comment with CSS and JS budget changes, each example's doctor level, and page weight, compared with `main` | strong-agent | M | `ci.split` |
| `ci.coverage` | Coverage for the Node tests with Node's built-in coverage, a floor that only rises, and the number in the job summary | strong-agent | S | `ci.split` |
| `ci.flaky` | Flaky-test report: a nightly run repeats the test suite three times and keeps one issue listing tests that both passed and failed | strong-agent | S | `ci.split` |
| `ci.nightly` | `nightly.yml`: the full matrix (Node 20, 22, 24; the pinned and newest Ruby; Ubuntu, macOS, and Windows for the CLI packages) | strong-agent | S | `ci.split` |
| `ci.repo-hygiene` | Remove stray root files (`zola-*.tar.gz`, `test_*.mjs`, `update-*.mjs`, the empty `stats.yml`) and add a test that fails on root files not on an allow list | free-agent | S | none |
| `ci.visual` | Visual diff: screenshots of every example on the pull request compared with `main`, changed pixels marked, and images uploaded as an artifact | strong-agent | M | `ci.split` |

### Exit criteria
- [ ] Fifteen agent pull requests merge through the merge queue in one day with no red `main`.
- [ ] `npm run check` in CI takes under ten minutes, and every pull request gets one report comment.


## Epic: Agent operations
<!-- slipway-roadmap-key: E-agent-ops -->
> **Epic** · **Phase:** v0.3 — Ready to scale (2026-10-30 → 2026-11-08)

### Outcome
Ready tasks reach agents without a person in the loop: the repository marks what is ready, hands it to Jules within a concurrency limit, keeps agent pull requests current, and reports throughput weekly.

### Scope
- Workflows are `.github/workflows/ops-*.yml`, one per task; their logic lives in `tools/ops/` with tests on recorded GitHub data
- `ops.graph` goes first; nothing here merges or approves a pull request

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `ops.graph` | `tools/ops/graph.mjs`: read roadmap issues from GitHub and compute which open tasks are ready (every dependency closed), tested on a recorded fixture | strong-agent | M | none |
| `ops.ready` | `ops-ready.yml`: on issue close and hourly, add `status: ready` to ready tasks and remove it from blocked ones | strong-agent | S | `ops.graph` |
| `ops.dispatch` | `ops-dispatch.yml`: label ready tasks `jules`, oldest milestone first, keeping at most 15 open agent pull requests and 3 per epic | strong-agent | M | `ops.ready` |
| `ops.enable` | Install the Jules GitHub app, choose the concurrency limits, and turn on `ops-dispatch.yml` | maintainer | XS | `ops.dispatch` |
| `ops.brief-lint` | Brief lint: every non-maintainer brief has Goal, Files, and Done when, and every file it says to edit exists | free-agent | S | none |
| `ops.update-branch` | `ops-update.yml`: when `main` moves, update agent pull request branches that are behind and have no conflict | strong-agent | S | none |
| `ops.overlap` | Overlap check: comment on a pull request when another open pull request edits the same file | strong-agent | S | none |
| `ops.ci-feedback` | When CI fails on an agent pull request, comment the failing step's last 80 log lines so the agent can fix it | strong-agent | S | none |
| `ops.stale` | Close agent pull requests with no commit in 5 days, say why, and put the issue back to `status: ready` | free-agent | S | `ops.dispatch` |
| `ops.epic-progress` | Epic progress: when a task closes, update a progress line ("7 of 12 done") at the top of its epic | free-agent | S | `ops.graph` |
| `ops.dashboard` | `site/ops/`: a page with ready, in progress, and blocked tasks per milestone, built from a JSON file a nightly job writes | strong-agent | M | `ops.graph` |
| `ops.weekly` | Weekly report issue: tasks closed, pull requests merged, median time from ready to merged, and CI failure rate | free-agent | S | `ops.graph` |

### Exit criteria
- [ ] For one week, every task that becomes ready is labeled within an hour and picked up by an agent without a maintainer touching it.


## Epic: Slipway's own site on GitHub Pages
<!-- slipway-roadmap-key: E-docs-site -->
> **Epic** · **Phase:** v0.3 — Ready to scale (2026-10-30 → 2026-11-08)

### Outcome
Slipway's own site on GitHub Pages is the best demo: built from the theme in the same commit, with every example and block live, checked at the top level by its own doctor, and the reference for every public API item 1.0 promises to keep.

### Scope
- `pages.baseurl` goes first: the deployed site loads its CSS from `/assets/` instead of `/slipway/assets/`
- `pages.from-checkout` owns `deploy-site.yml`; later tasks add their own workflow files

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
| `pages.baseurl` | Fix the deployed site: it loads assets from `/assets/` instead of `/slipway/assets/`, so it has no styles; build with the Pages base URL and test it | strong-agent | S | none |
| `pages.from-checkout` | The site builds with the theme files from the same commit, not a released gem, so every merge to `main` shows the current theme | strong-agent | S | `pages.baseurl` |
| `pages.examples` | Every example lives on the site under `/examples/<name>/`, with an index page | strong-agent | S | `pages.from-checkout` |
| `pages.doctor-gate` | `pages-doctor.yml`: build the site and fail unless `slipway doctor` reports L3 for it | free-agent | S | `pages.from-checkout` |
| `pages.live-check` | `pages-live.yml`: every night, run Seaworthy and a link check on the deployed URL and keep one issue open on failure | free-agent | S | `pages.baseurl` |
| `pages.lighthouse` | `pages-lighthouse.yml`: Lighthouse budgets (95 or more in performance, accessibility, best practices, and SEO) on the home, a doc, and a block page | free-agent | S | `pages.baseurl` |
| `pages.blocks` | Every page in `site/blocks/` renders its block live next to its source, in LTR and RTL | free-agent | S | `pages.from-checkout` |
| `pages.spec-nav` | One navigation across the theme docs and the spec site under `/spec/`, with a link back | free-agent | S | `pages.from-checkout` |
| `pages.roadmap` | `site/roadmap.md`: the public roadmap generated from `ROADMAP.md`, with milestones, epics, and outcomes, checked for staleness | strong-agent | S | none |
| `pages.changelog` | `site/changelog.md`: the changelog page from `CHANGELOG.md` with the changelog layout | free-agent | XS | none |
| `pages.not-found` | A 404 page on the deployed site that suggests pages by the URL's last segment | free-agent | XS | `pages.baseurl` |
| `pages.domain` | Custom domain for the site, with HTTPS enforced | maintainer | XS | `pages.baseurl` |

### Exit criteria
- [ ] Every public API item named in the semver ADR has a reference page generated or checked in CI.
- [ ] The deployed site reaches L3 in `slipway doctor` and passes Seaworthy every night.


## Epic: Supply-chain security
<!-- slipway-roadmap-key: E-supply-chain -->
> **Epic** · **Phase:** v0.3 — Ready to scale (2026-10-30 → 2026-11-08)

### Outcome
Anyone can verify that a Slipway release was built from this repository by its release workflow, and the repository scores 8 or more on the OpenSSF Scorecard.

### Scope
- `sec.provenance`, `sec.sbom`, and `sec.verify-doc` change the release in turn; the others add their own files

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `sec.threat-model` | ADR: threat model for the theme, the gem, the Actions, the CLI packages, and agent pull requests | strong-agent | S | none |
| `sec.scorecard` | `scorecard.yml`: OpenSSF Scorecard weekly, results in code scanning, and a badge in the README | free-agent | XS | none |
| `sec.provenance` | Release workflow: a build provenance attestation for the gem with `actions/attest-build-provenance` | strong-agent | S | none |
| `sec.sbom` | Release workflow: attach a CycloneDX SBOM of the gem and the npm packages to each GitHub release | free-agent | S | `sec.provenance` |
| `sec.verify-doc` | `docs/verify-release.md`: verify a release's attestation and SBOM with `gh attestation verify` | free-agent | XS | `sec.sbom` |
| `sec.dependency-review` | `dependency-review.yml`: block pull requests that add a dependency with a known vulnerability or a disallowed license | free-agent | XS | none |
| `sec.secrets` | `secrets.yml`: gitleaks on every pull request and on the full history weekly | free-agent | XS | none |
| `sec.lockfile` | Lockfile check: `package-lock.json` resolves only from the npm registry over HTTPS, and `Gemfile.lock` only from RubyGems | free-agent | S | none |
| `sec.action-inputs` | Harden the Actions: inputs reach scripts through `env`, never inline `${{ }}` in `run`, checked by a test | strong-agent | S | none |
| `sec.policy` | `SECURITY.md`, private vulnerability reporting, and a supported-versions table | maintainer | XS | `sec.threat-model` |
| `sec.rules` | Branch ruleset on `main`: required `ci-ok`, no force push, no deletion, and the merge queue | maintainer | XS | `ci.split` |

### Exit criteria
- [ ] `gh attestation verify` passes on the latest gem, the release carries an SBOM, and the Scorecard is 8 or more.


## Epic: Dependency lifecycle with Evergreen
<!-- slipway-roadmap-key: E-lifecycle -->
> **Epic** · **Phase:** v0.3 — Ready to scale (2026-10-30 → 2026-11-08)

### Outcome
Slipway and the sites built with it find end-of-life runtimes, gems, packages, and Actions before they break a build, using Evergreen optionally, the way Slipway uses Seaworthy.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `lifecycle.adr` | ADR: Slipway and Evergreen, optional and one-way | strong-agent | XS | `parallel.merge-safe` |
| `lifecycle.ci` | Slipway's CI scans its own runtimes, gems, packages, and Actions with Evergreen, report-only | free-agent | S | `parallel.merge-safe`, `lifecycle.adr` |
| `lifecycle.dependabot` | Dependabot for Actions, npm, and Bundler, grouped to keep pull requests few | free-agent | XS | `parallel.merge-safe` |
| `lifecycle.actions-pin` | Pin every GitHub Action in this repository to a commit SHA, checked by a test | strong-agent | S | `parallel.merge-safe`, `lifecycle.ci` |
| `lifecycle.runtimes` | Supported runtimes page: Ruby, Node, Jekyll, and the Pages gem, with end-of-life dates, checked against the repository | free-agent | S | `parallel.merge-safe` |
| `lifecycle.starter-workflow` | Opt-in lifecycle workflow for sites: one file in `starter-files/` | free-agent | S | `parallel.merge-safe`, `lifecycle.adr` |
| `lifecycle.doctor-runtimes` | Check: a site's workflow or `.ruby-version` uses an end-of-life runtime (needs Evergreen data, skips without it) | strong-agent | S | `parallel.merge-safe`, `parallel.doctor-registry`, `lifecycle.adr` |
| `lifecycle.skill-hint` | Site Skill: check a new dependency's lifecycle before adding it (Evergreen when available) | free-agent | XS | `parallel.merge-safe`, `lifecycle.adr` |
| `lifecycle.cle` | Publish Slipway's deprecated config keys as lifecycle declarations Evergreen reads | strong-agent | S | `parallel.merge-safe`, `lifecycle.adr` |
| `lifecycle.recipe` | Recipe: keep a site's dependencies alive with Evergreen | free-agent | XS | `parallel.merge-safe`, `lifecycle.starter-workflow`, `parallel.docs-autonav` |

### Exit criteria
- [ ] Slipway's own CI reports lifecycle findings with Evergreen, and a site can opt in with one workflow file.


---

# v0.4 — Docs platform (2026-11-05 → 2026-11-22)

## Epic: Code reference from source
<!-- slipway-roadmap-key: E-codedocs -->
> **Epic** · **Phase:** v0.4 — Docs platform (2026-11-05 → 2026-11-22)

### Outcome
A project like Evergreen publishes the best reference for its own code: every module, function, type, and endpoint gets a page generated from its source, linked to the exact line, searchable, and readable by agents.

### Scope
- Slipway renders one neutral model (`schema/api.schema.json`); each language gets a converter in `tools/api/<language>/` from its native doc tool's output
- Generated reference pages link to the code; they stay out of the source map

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `api.model` | ADR and `schema/api.schema.json`: a language-neutral model of modules, symbols, signatures, docs, and source locations, with a fixture | strong-agent | M | none |
| `api.layout` | `api` layout: a module page and a symbol page from `_data/api/*.json`, with signature, parameters, returns, examples, and a source link | strong-agent | M | `api.model` |
| `api.typescript` | `tools/api/typescript/`: convert TypeDoc JSON into the model | strong-agent | M | `api.model` |
| `api.go` | `tools/api/go/`: convert Go package docs into the model | strong-agent | M | `api.model` |
| `api.python` | `tools/api/python/`: convert griffe JSON into the model | strong-agent | M | `api.model` |
| `api.rust` | `tools/api/rust/`: convert rustdoc JSON into the model | strong-agent | M | `api.model` |
| `api.openapi` | `tools/api/openapi/`: an OpenAPI 3.1 file becomes endpoint pages built on `blocks/endpoint.html` | strong-agent | M | `api.model` |
| `api.source-links` | Source links to the exact line at a pinned commit or tag, for GitHub, GitLab, and Codeberg | free-agent | S | `api.layout` |
| `api.snippets` | `snippet` include: embed lines from a repository file by region marker, with a check that fails when the region is gone | strong-agent | S | none |
| `api.search` | Symbols in the search index with their kind, ranked above prose for exact names | free-agent | S | `api.layout` |
| `api.llms` | API pages in `llms-full.txt` and Markdown twins as signatures plus docs, not HTML | free-agent | S | `api.layout` |
| `api.doctor` | Doctor check: links to a symbol that is not in the model | strong-agent | S | `api.layout` |
| `api.example` | `examples/api-docs`: an example site with a small TypeScript and OpenAPI reference, built in CI | strong-agent | S | `api.typescript`, `api.openapi`, `api.layout` |
| `api.evergreen` | Evergreen's code reference on its site, generated in its CI (pull request in arminazimi/evergreen) | strong-agent | M | `api.typescript`, `api.layout`, `evergreen.switch` |

### Exit criteria
- [ ] Evergreen's site has a full code reference generated in its CI, and `examples/api-docs` reaches L3.


## Epic: Docs hosting for any repository
<!-- slipway-roadmap-key: E-docs-host -->
> **Epic** · **Phase:** v0.4 — Docs platform (2026-11-05 → 2026-11-22)

### Outcome
Any repository with a `docs/` folder gets a versioned documentation site on GitHub Pages from one small file and one workflow, and Slipway becomes a default place open-source projects host their docs.

### Scope
- `slipway.yml` is the only file a project adds; it maps to `_config.yml` so the theme stays the same
- Importers live in `tools/host/`, one file each

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `host.config` | `slipway.yml`: the minimal docs config (title, docs folder, navigation order, repository link), its schema, and how it maps to `_config.yml` | strong-agent | M | none |
| `host.build` | `tools/host/build.mjs`: build a site from `docs/` and `slipway.yml` with no `_config.yml`, no Gemfile, and no front matter in the pages | strong-agent | M | `host.config` |
| `host.versions` | Versioned docs: one folder per release tag under `/v/<version>/`, a version switcher, and `latest` | strong-agent | M | `host.build` |
| `host.version-banner` | Banner on old versions that links to the same page in the latest version | free-agent | S | `host.versions` |
| `host.monorepo` | Monorepo docs: several `docs/` folders (one per package) in one site with a package switcher | strong-agent | M | `host.build` |
| `host.redirects` | `redirects` in `slipway.yml`: static redirect pages for moved URLs | free-agent | S | `host.build` |
| `host.readme` | A repository with only a `README.md` gets a one-page site whose headings become the table of contents | free-agent | S | `host.build` |
| `host.import-wiki` | `tools/host/import-wiki.mjs`: turn a GitHub Wiki clone into a `docs/` folder, keeping links and the sidebar | strong-agent | S | `host.config` |
| `host.import-docsify` | Import from Docsify and GitBook-style folders (`_sidebar.md`, `SUMMARY.md`) | strong-agent | S | `host.config` |
| `host.diataxis` | `starters/docs-diataxis/`: a docs starter split into tutorials, how-to guides, reference, and explanation | free-agent | S | `host.config` |
| `host.quality` | Doctor checks for docs: orphan pages, pages without a description, and headings that skip a level | strong-agent | S | none |
| `host.guide` | `site/guides/host-your-docs.md`: host a project's docs on Slipway in five minutes | free-agent | S | `host.build` |

### Exit criteria
- [ ] Three outside repositories host their docs with only `slipway.yml` and the deploy workflow.


## Epic: Product documentation kit
<!-- slipway-roadmap-key: E-docs-kit -->
> **Epic** · **Phase:** v0.4 — Docs platform (2026-11-05 → 2026-11-22)

### Outcome
Everything a developer tool's documentation needs beyond pages (CLI reference, changelog, schema tables, decision records, status banners), learned from moving Evergreen.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `kit.cli-ref` | CLI reference layout from `_data/cli/*.yml`: commands, flags, examples, exit codes | strong-agent | M | `parallel.css-components`, `parallel.sorted` |
| `kit.changelog` | Changelog layout: a Keep a Changelog file with version anchors and a releases feed | free-agent | S | `parallel.css-components`, `parallel.sorted` |
| `kit.json-schema` | Schema table include: render a JSON Schema from `_data` as a property table | strong-agent | S | `parallel.css-components`, `parallel.sorted` |
| `kit.status-banner` | Page status from front matter: experimental, beta, deprecated, with `since` and a replacement link | free-agent | S | `parallel.css-components`, `parallel.sorted`, `evergreen.large-section`, `evergreen.search-scale` |
| `kit.terminal` | Terminal block: commands and output, where copy takes only the commands | free-agent | S | `parallel.css-components`, `parallel.sorted` |
| `kit.glossary` | Glossary: `_data/glossary.yml`, a glossary page, and a term include that links to it | free-agent | S | `parallel.css-components`, `parallel.sorted` |
| `kit.adr` | Decision records: an `adr` layout with status and supersedes, and an index by status | free-agent | S | `parallel.css-components`, `parallel.sorted` |
| `kit.last-updated` | "Last updated" on doc pages from `last_modified_at`, or from git in Actions mode | strong-agent | S | `parallel.css-components`, `parallel.sorted`, `kit.status-banner` |
| `kit.filter-table` | Filter for long lists and tables: type to narrow rows, all rows shown without JavaScript | strong-agent | S | `parallel.css-components`, `parallel.sorted` |
| `kit.canonical` | Respect `canonical_url` and `description` from front matter in SEO tags and JSON-LD | free-agent | XS | `parallel.css-components`, `parallel.sorted`, `kit.last-updated` |

### Exit criteria
- [ ] `examples/product-docs` uses every kit feature, and each is covered by a fixture test.


## Epic: Diagrams
<!-- slipway-roadmap-key: E-diagrams -->
> **Epic** · **Phase:** v0.4 — Docs platform (2026-11-05 → 2026-11-22)

### Outcome
Diagrams are written as text (Mermaid or D2), drawn at build time where the mode allows, themed by the design tokens, readable in right-to-left languages, and always come with a text alternative that agents read.

### Scope
- `block.mermaid` and `block.math` move here from the content blocks epic; `block.mermaid` stays the client-side fallback

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `diagram.adr` | ADR: diagrams drawn at build time where the mode allows, client side as the opt-in fallback, with the text source always kept | strong-agent | S | none |
| `diagram.include` | `diagram` include: one interface for Mermaid and D2 with a caption, a text alternative, and the source in a `<details>` | strong-agent | S | `diagram.adr` |
| `diagram.build` | Actions mode: render Mermaid to inline SVG at build time with no JavaScript on the page | strong-agent | M | `diagram.include` |
| `diagram.prerender` | Classic Pages: `tools/diagrams/render.mjs` writes diagrams to committed SVG files, and a check fails when one is stale | strong-agent | M | `diagram.include` |
| `diagram.d2` | D2 in the build-time renderer and the pre-render tool | strong-agent | S | `diagram.build`, `diagram.prerender` |
| `diagram.theme` | Diagram colors and fonts from the design tokens, in light and dark | free-agent | S | `diagram.include` |
| `diagram.rtl` | Right-to-left diagrams: Persian and Arabic labels shape correctly and flowcharts can run right to left | strong-agent | S | `diagram.d2` |
| `diagram.a11y` | Every diagram needs a text alternative; a doctor check finds those without one | free-agent | S | `diagram.include` |
| `diagram.twins` | The diagram source, not the SVG, goes into Markdown twins and `llms-full.txt` | free-agent | S | `diagram.include` |
| `diagram.docs` | `site/blocks/diagram.md`: the diagram block with an example of each kind | free-agent | XS | `diagram.include` |
| `block.mermaid` | Mermaid diagrams, opt-in, loaded only on pages that use them | strong-agent | S | `ext.blocks` |
| `block.math` | Math with KaTeX, opt-in per page, with a no-JavaScript fallback | strong-agent | S | `ext.blocks` |

### Exit criteria
- [ ] A page with a Mermaid and a D2 diagram ships no diagram JavaScript in Actions mode and passes the accessibility checks in light, dark, and RTL.


## Epic: Social cards
<!-- slipway-roadmap-key: E-og -->
> **Epic** · **Phase:** v0.4 — Docs platform (2026-11-05 → 2026-11-22)

### Outcome
Every page gets a social card made from its title and the site's design tokens, in every language, so shared links look designed without anyone opening an image editor.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `og.template` | ADR and SVG card template from the design tokens: title, site name, section, and mark | strong-agent | S | none |
| `og.render` | Actions mode: render one PNG card per page at build time | strong-agent | M | `og.template` |
| `og.classic` | Classic Pages: `tools/og/render.mjs` writes cards to `assets/og/`, and a check fails when one is missing or stale | strong-agent | M | `og.template` |
| `og.rtl` | Persian, Arabic, and Hebrew titles shape and align correctly on cards | strong-agent | S | `og.render` |
| `og.meta` | `og:image`, `twitter:card`, size, and alt text in the page head for pages with a card | free-agent | S | `og.template` |
| `og.layouts` | Card variants for posts (date and author), docs (section), and home | free-agent | S | `og.incremental` |
| `og.override` | `image` in front matter overrides the card; `og: false` turns it off | free-agent | XS | `og.meta` |
| `og.jsonld` | The card is the `image` in each page's JSON-LD | free-agent | XS | `og.meta` |
| `og.budget` | Cards stay under 100 KB each, checked in CI | free-agent | XS | `og.render` |
| `og.incremental` | Only pages whose title or template changed get a new card | strong-agent | S | `og.rtl` |
| `og.docs` | `site/guides/social-cards.md`: how cards work and how to change them | free-agent | XS | `og.meta` |

### Exit criteria
- [ ] Every page of every example has a card under 100 KB, and Persian and Arabic titles render correctly.


---

# v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

## Epic: More Agent Skills
<!-- slipway-roadmap-key: E-skills -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

### Outcome
An agent on a Slipway site has a skill for every common job, each tested so its paths and commands exist and its description triggers on the requests it is for.

### Scope
- One folder per skill under `skills/`; `skill.harness` makes the shared test find them, so no task edits another skill's files

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `skill.harness` | Generic skill test: find every `skills/*/SKILL.md` and check front matter, paths, commands, and YAML snippets | strong-agent | S | none |
| `skill.blocks` | `skills/slipway-blocks/`: choose and insert content blocks with valid parameters | free-agent | S | `skill.harness` |
| `skill.migrate` | `skills/slipway-migrate/`: move a site from another Jekyll theme and check it with the doctor | strong-agent | S | `skill.harness` |
| `skill.translate` | `skills/slipway-translate/`: add a language, translate pages, and keep translations linked | free-agent | S | `skill.harness` |
| `skill.deploy` | `skills/slipway-deploy/`: publish to GitHub Pages, set a custom domain, and fix common deploy errors | free-agent | S | `skill.harness` |
| `skill.design` | `skills/slipway-design/`: restyle a site with tokens and presets while keeping the contrast checks green | free-agent | S | `skill.harness` |
| `skill.release-notes` | `skills/slipway-release-notes/`: write a release post and a changelog entry from merged pull requests | free-agent | S | `skill.harness` |
| `skill.adapters` | `skills/slipway-adapters/`: make a Hugo, Eleventy, or Docusaurus site agent-editable with the adapters | strong-agent | S | `skill.harness` |
| `skill.api-docs` | `skills/slipway-api-docs/`: generate and publish a code reference | strong-agent | S | `skill.harness`, `api.layout` |
| `skill.evals` | `tools/skill-evals/`: eval prompts with expected outcomes per skill, run on demand and weekly | strong-agent | M | `skill.harness` |
| `skill.triggers` | Trigger tests: each skill lists prompts that should and should not trigger it, and descriptions are tuned until they do | strong-agent | S | `skill.evals` |
| `skill.version` | Skills carry the theme version; a test fails when a skill's version lags the gemspec | free-agent | XS | `skill.triggers` |

### Exit criteria
- [ ] Eleven skills pass the harness and their trigger tests.


## Epic: Skills where agents look
<!-- slipway-roadmap-key: E-skill-reach -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

### Outcome
Slipway's skills install with one command from every place agents look for them, and installs grow from a handful to thousands, counted weekly.

### Scope
- One source in `skills/` generates every format; each registry or agent is one task

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `skillreach.dist` | `tools/skill-dist/`: generate every distribution format from `skills/`, with a check that fails when one is stale | strong-agent | M | none |
| `skillreach.skills-sh` | List the skills on skills.sh with descriptions, tags, and the install command | maintainer | XS | `skillreach.dist` |
| `skillreach.claude` | A Claude Code plugin marketplace file so `/plugin marketplace add arminazimi/slipway` installs the plugin | strong-agent | S | `skillreach.dist` |
| `skillreach.codex` | Codex: install instructions and a tested plugin layout | free-agent | S | `skillreach.dist` |
| `skillreach.cursor` | Cursor: rules generated from the skills into `.cursor/rules/` | free-agent | S | `skillreach.dist` |
| `skillreach.gemini` | Gemini CLI: an extension with the skills and the MCP server | free-agent | S | `skillreach.dist` |
| `skillreach.copilot` | GitHub Copilot: `.github/copilot-instructions.md` and agent files for sites, generated from the skills | free-agent | S | `skillreach.dist` |
| `skillreach.create` | `create-slipway` installs the skills into the new site for the agents it finds, with `--no-skills` to skip | strong-agent | S | `skillreach.dist` |
| `skillreach.doctor-hint` | `slipway doctor` prints one line with the install command when no Slipway skill is found | free-agent | XS | none |
| `skillreach.starters` | Every starter ships the skill files for Claude, Codex, Cursor, and Copilot | free-agent | S | `skillreach.cursor`, `skillreach.copilot` |
| `skillreach.page` | `site/skills.md`: what each skill does, a demo, and the install commands | free-agent | S | `skillreach.dist` |
| `skillreach.lists` | Submit the skills to awesome lists and agent skill directories, tracking each submission in the issue | maintainer | S | `skillreach.page` |
| `skillreach.metrics` | Weekly skill install counts from each registry in the stats report | strong-agent | S | `skillreach.skills-sh` |

### Exit criteria
- [ ] The skills install with one command in Claude Code, Codex, Cursor, Gemini CLI, and Copilot, and weekly installs are published.


## Epic: GitHub Actions suite
<!-- slipway-roadmap-key: E-action -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

### Outcome
One `uses:` line builds, checks, previews, and deploys any Slipway site, and every pull request on such a site shows what changed for agents.

### Scope
- One folder per Action under `action/`; `action.layout` adds the shared tests

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `action.layout` | Action layout: one folder per Action under `action/`, a shared test that runs each on a fixture, and an index README | strong-agent | S | `sec.action-inputs` |
| `action.setup` | `action/setup/`: install the Slipway CLI and doctor with caching, for use in other jobs | free-agent | S | `action.layout` |
| `action.deploy` | `action/deploy/`: build in Actions mode (source map, twins, plugins) and deploy to GitHub Pages | strong-agent | M | `action.layout` |
| `action.preview` | `action/preview/`: deploy a pull request's site to a preview path, comment the link, and remove it on close | strong-agent | M | `action.deploy` |
| `action.diff` | Doctor diff: compare the pull request with its base and report new and fixed findings in one comment | strong-agent | S | `action.layout` |
| `action.suggest` | `fix: suggest`: post safe `slipway doctor --fix` changes as review suggestions | strong-agent | M | `action.detect` |
| `action.summary` | Job summary with the level, a findings table, and a badge JSON file for shields.io | free-agent | S | `action.diff` |
| `action.detect` | `build: auto`: the doctor Action finds the generator (Jekyll, Hugo, Eleventy, Docusaurus) and builds before checking | strong-agent | S | `action.summary` |
| `action.api-docs` | `action/api-docs/`: generate the code reference data for a language and upload it for the site build | strong-agent | S | `action.layout`, `api.typescript` |
| `action.os` | Test every Action on Ubuntu, macOS, and Windows runners | free-agent | S | `action.layout` |
| `action.recipes` | Copy-paste workflows in `docs/workflows/` for deploy, preview, and doctor, each tested in CI | free-agent | S | `action.deploy` |
| `action.marketplace` | Publish the Actions on the Marketplace with a moving `v1` tag and release notes | maintainer | S | `action.deploy`, `action.summary` |

### Exit criteria
- [ ] Ten outside repositories use `slipway/deploy` or `slipway/doctor`, and every Action passes on Ubuntu, macOS, and Windows.


## Epic: Discoverable by agents
<!-- slipway-roadmap-key: E-agent-reach -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

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


## Epic: MCP tools, round three
<!-- slipway-roadmap-key: E-mcp-3 -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

### Outcome
An agent finds, reads, moves, and checks content through the MCP server by file and line, without reading the whole site.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `mcp.list-pages` | MCP tool `list_pages`: every page with its URL, source file, layout, language, and title | free-agent | S | `parallel.mcp-registry` |
| `mcp.read-section` | MCP tool `read_section`: one section of a page by heading or by line | strong-agent | S | `parallel.mcp-registry` |
| `mcp.find-text` | MCP tool `find_text`: search content sources and return file, line, and the section heading | free-agent | S | `parallel.mcp-registry` |
| `mcp.move-page` | MCP tool `move_page`: move a page, add `redirect_from`, and update navigation and links | strong-agent | M | `parallel.mcp-registry` |
| `mcp.add-block` | MCP tool `add_block`: insert a block after a heading, with options validated against its schema | strong-agent | S | `parallel.mcp-registry`, `ext.blocks` |
| `mcp.list-blocks` | MCP tool `list_blocks`: available blocks with their options and an example | free-agent | XS | `parallel.mcp-registry`, `ext.blocks` |
| `mcp.validate-page` | MCP tool `validate_page`: front matter of one page against its layout schema | free-agent | S | `parallel.mcp-registry` |
| `mcp.source-for-url` | MCP tool `source_for_url`: built URL (and optional anchor) to source file and line | free-agent | S | `parallel.mcp-registry` |
| `mcp.scaffold-translation` | MCP tool `scaffold_translation`: create a translation stub with `lang` and `translation_key` | free-agent | S | `parallel.mcp-registry` |
| `mcp.findings-for-file` | MCP tool `findings_for_file`: `slipway doctor` findings for one source file | free-agent | S | `parallel.mcp-registry` |

### Exit criteria
- [ ] An agent moves a page, adds a block, and scaffolds a translation through MCP tools, then gets a clean `slipway doctor` report.


## Epic: Node-only site tooling
<!-- slipway-roadmap-key: E-cli -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

### Outcome
`npx slipway <command>` does the common site chores (new pages, navigation, translations, stubs, twins, source maps, pinning) with Node alone, so agents in a bare environment need no Ruby.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `cli.commands` | `slipway` subcommands discovered from `packages/doctor/src/commands/`, with shared `--help`, `--json`, and exit codes | strong-agent | S | `parallel.merge-safe`, `doctor.explain` |
| `cli.twins` | `slipway twins [site] [--check]`: Markdown twin stubs without Ruby, identical to the Ruby output | strong-agent | M | `cli.commands` |
| `cli.sourcemap` | `slipway sourcemap [site] [--check]`: level-1 source map without Ruby | strong-agent | M | `cli.commands` |
| `cli.new` | `slipway new <layout> <path>` for pages, posts, and docs: schema-valid front matter from the layout's schema | free-agent | S | `cli.commands` |
| `cli.nav` | `slipway nav` add, remove, and check: edit `_data/navigation.yml` without breaking its schema | free-agent | S | `cli.commands` |
| `cli.translate` | `slipway translate <page> --to <lang>`: create a translation stub | free-agent | S | `cli.commands` |
| `cli.stubs` | `slipway stubs [--check]`: copy or update the stub files a site needs, keeping files the site owns | free-agent | S | `cli.commands`, `standalone.stubs`, `evergreen.site-files` |
| `cli.info` | `slipway info`: mode, theme pin, versions, and spec level, for bug reports | free-agent | XS | `cli.commands` |
| `cli.pin` | `slipway pin <version>`: update the `remote_theme` pin and print upgrade notes in between | free-agent | S | `cli.commands` |
| `cli.completion` | `slipway completion <shell>`: bash, zsh, and fish completion from the command files | free-agent | XS | `cli.commands` |

### Exit criteria
- [ ] On a machine with only Node, an agent creates a page, adds it to navigation, regenerates twins and the source map, and pins a theme version with `npx slipway`.


## Epic: Doctor checks, round two
<!-- slipway-roadmap-key: E-doctor-checks -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

### Outcome
`slipway doctor` catches the mistakes agents actually make when editing a site (stale instructions, stale source maps, edits to generated pages, unknown keys) and explains each finding.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `doctor.agents-commands` | Check: every command and path in a site's `AGENTS.md` exists | strong-agent | S | `parallel.doctor-registry` |
| `doctor.sourcemap-fresh` | Check: `sourcemap.json` lines still match the Markdown sources | strong-agent | S | `parallel.doctor-registry` |
| `doctor.twin-fresh` | Check: Markdown twins match their pages (missing, stale, or orphaned twins) | free-agent | S | `parallel.doctor-registry` |
| `doctor.schema-coverage` | Check: every layout and collection in use has a content schema | free-agent | S | `parallel.doctor-registry` |
| `doctor.generated-pages` | Check: generated pages declare their generator, and edit prompts point at it | strong-agent | M | `parallel.doctor-registry`, `kit.canonical` |
| `doctor.nav-targets` | Check: every `_data/navigation.yml` entry points at a page that exists | free-agent | S | `parallel.doctor-registry` |
| `doctor.unknown-config` | Check: unknown `slipway:` config keys, with a "did you mean" suggestion | free-agent | S | `parallel.doctor-registry` |
| `doctor.unknown-front-matter` | Check: unknown front-matter fields, with a "did you mean" suggestion | free-agent | S | `parallel.doctor-registry` |
| `doctor.root-links` | Check: root-relative links that skip `baseurl` on project sites | free-agent | S | `parallel.doctor-registry` |
| `doctor.explain` | `slipway doctor --explain <id>` prints a check's page: why it matters and how to fix it | free-agent | S | `parallel.doctor-registry` |

### Exit criteria
- [ ] Ten new checks run on every example with no false positives, and `slipway doctor --explain <id>` prints each one's page.


## Epic: Agent tooling, round two
<!-- slipway-roadmap-key: E-agent-tooling -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

### Outcome
The first agent tools (Phase 2) get their second layer: MCP editing tools, plugins, WebMCP, a badge, `--fix`, CI recipes, and the first outreach and migration guide.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `standalone.existing-site` | Guide: switch an existing Jekyll site to Slipway, keeping permalinks and mapping front matter | free-agent | S | `standalone.stubs` |
| `spec.outreach` | Invite three theme maintainers to adopt the spec | maintainer | S | `spec.site` |
| `doctor.badge` | Conformance badge showing the level a site reaches, produced by the Action | free-agent | S | `doctor.action` |
| `doctor.ci-recipes` | Recipes for GitLab CI, Netlify, Cloudflare Pages, Vercel, and pre-commit | free-agent | S | `doctor.cli` |
| `doctor.fix` | `--fix` for safe cases (missing stubs, deprecated keys), with a dry-run diff | strong-agent | M | `doctor.output`, `standalone.deprecations` |
| `agent.mcp-tools` | MCP tools: create page, set token, add navigation item, list layouts, preview | strong-agent | M | `agent.mcp-server` |
| `agent.webmcp` | Experimental WebMCP tools in every site: search, page Markdown, and page list, off by default | strong-agent | M | `spike.webmcp`, `theme.search` |
| `agent.plugins` | Claude Code and Codex plugins bundling the Skills and the MCP server | strong-agent | S | `agent.skill-site`, `agent.mcp-tools` |

### Exit criteria
- [ ] An agent creates a page, sets a token, and adds a navigation item through the MCP tools, then gets a clean `slipway doctor` report.
- [ ] A Slipway site shows its conformance badge, and `slipway doctor --fix` repairs the safe cases with a dry-run diff.


## Epic: Theme agent-readable output
<!-- slipway-roadmap-key: E-theme-ai -->
> **Epic** · **Phase:** v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

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

# v0.6 — Content and languages (2026-11-16 → 2026-12-20)

## Epic: Persian and Arabic typography checks
<!-- slipway-roadmap-key: E-persian-type -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

### Outcome
`slipway doctor` catches and fixes the typography mistakes that make Persian and Arabic text look careless (missing zero-width non-joiners, Arabic yeh and kaf in Persian, mixed digits, Latin punctuation), and never touches code.

### Scope
- Each rule is one check file in `packages/doctor/src/checks/`; rules are warnings and never change the level

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `fa.prose` | Prose reader for typography rules: text from Markdown without code, front matter, URLs, or Liquid, with the page language and source lines | strong-agent | M | none |
| `fa.zwnj` | Typography rule: Missing zero-width non-joiner in Persian prefixes and suffixes (می‌، نمی‌، ‌ها، ‌تر، ‌ترین) | strong-agent | S | `fa.prose` |
| `fa.letters` | Typography rule: Arabic yeh (ي) and kaf (ك) in Persian text, and Persian forms in Arabic text | free-agent | S | `fa.prose` |
| `fa.digits` | Typography rule: Mixed Latin, Persian, and Arabic digits on one page, with a `digits` setting | free-agent | S | `fa.prose` |
| `fa.punctuation` | Typography rule: Latin comma, semicolon, question mark, and quotes in Persian and Arabic text | free-agent | S | `fa.prose` |
| `fa.spacing` | Typography rule: Space before punctuation, no space after it, and double spaces | free-agent | S | `fa.prose` |
| `fa.kashida` | Typography rule: Kashida (ـ) and repeated letters used for stretching | free-agent | XS | `fa.prose` |
| `fa.fix` | `--fix` for the safe rules (letters, punctuation, spacing), with `--dry-run` | strong-agent | S | `fa.letters`, `fa.punctuation`, `fa.spacing` |
| `fa.corpus` | Test corpus: real Persian and Arabic pages with expected findings, so no rule fires on correct text | strong-agent | S | `fa.prose` |
| `fa.config` | Settings to turn rules off per site or per page, in the config and front matter schemas | free-agent | S | `fa.prose` |
| `fa.docs` | `site/guides/persian-typography.md` in Persian and English, and a section in the content skill | free-agent | S | `fa.zwnj`, `fa.letters` |

### Exit criteria
- [ ] The rules run on the Persian example and on Evergreen's Persian pages with no false positives, and `--fix` corrects the safe ones.


## Epic: Interface in 40 languages
<!-- slipway-roadmap-key: E-ui-languages -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

### Outcome
The theme's interface strings exist in 40 languages, each complete and checked, so most readers see Slipway in their own language.

### Scope
- One task per language: `_includes/i18n/<code>.html` and nothing else, plus a font file in `assets/css/lang/` for scripts that need one
- Every task can run at the same time once `lang.coverage` lands

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `lang.coverage` | Coverage test and table: every `_includes/i18n/*.html` has every key in `en.html`, and `site/languages.md` lists each language's completeness | strong-agent | S | none |
| `lang.ko` | Interface strings in Korean (`ko`) | free-agent | XS | `lang.coverage` |
| `lang.hi` | Interface strings in Hindi (`hi`) | free-agent | XS | `lang.coverage` |
| `lang.bn` | Interface strings in Bengali (`bn`) | free-agent | XS | `lang.coverage` |
| `lang.id` | Interface strings in Indonesian (`id`) | free-agent | XS | `lang.coverage` |
| `lang.ms` | Interface strings in Malay (`ms`) | free-agent | XS | `lang.coverage` |
| `lang.vi` | Interface strings in Vietnamese (`vi`) | free-agent | XS | `lang.coverage` |
| `lang.th` | Interface strings in Thai (`th`) | free-agent | XS | `lang.coverage` |
| `lang.pl` | Interface strings in Polish (`pl`) | free-agent | XS | `lang.coverage` |
| `lang.uk` | Interface strings in Ukrainian (`uk`) | free-agent | XS | `lang.coverage` |
| `lang.cs` | Interface strings in Czech (`cs`) | free-agent | XS | `lang.coverage` |
| `lang.sv` | Interface strings in Swedish (`sv`) | free-agent | XS | `lang.coverage` |
| `lang.da` | Interface strings in Danish (`da`) | free-agent | XS | `lang.coverage` |
| `lang.nb` | Interface strings in Norwegian Bokmål (`nb`) | free-agent | XS | `lang.coverage` |
| `lang.fi` | Interface strings in Finnish (`fi`) | free-agent | XS | `lang.coverage` |
| `lang.el` | Interface strings in Greek (`el`) | free-agent | XS | `lang.coverage` |
| `lang.ro` | Interface strings in Romanian (`ro`) | free-agent | XS | `lang.coverage` |
| `lang.hu` | Interface strings in Hungarian (`hu`) | free-agent | XS | `lang.coverage` |
| `lang.az` | Interface strings in Azerbaijani (`az`) | free-agent | XS | `lang.coverage` |
| `lang.sw` | Interface strings in Swahili (`sw`) | free-agent | XS | `lang.coverage` |
| `lang.ta` | Interface strings in Tamil (`ta`) | free-agent | XS | `lang.coverage` |
| `lang.ug` | Interface strings in Uyghur (`ug`), right to left | free-agent | S | `lang.coverage` |
| `lang.sd` | Interface strings in Sindhi (`sd`), right to left | free-agent | S | `lang.coverage` |

### Exit criteria
- [ ] Forty languages pass the coverage test, and `site/languages.md` shows each one at 100%.


## Epic: Visual editing
<!-- slipway-roadmap-key: E-cms -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

### Outcome
People who do not write code can edit a Slipway site in the browser with a CMS whose fields come from the same schemas agents use, so both stay valid.

### Scope
- The CMS is opt-in and lives under `admin/`; its config is generated from `schema/`, never written by hand

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `cms.adr` | ADR: Sveltia CMS or Decap CMS, the GitHub backend, and how authentication works on GitHub Pages | strong-agent | S | none |
| `cms.generate` | `tools/cms/generate.mjs`: write `admin/config.yml` from the config and front matter schemas, with a stale check | strong-agent | M | `cms.adr` |
| `cms.admin` | `admin/index.html` that loads the CMS, opt-in with `cms: true` | free-agent | S | `cms.adr` |
| `cms.collections` | Collections for pages, docs, posts, authors, and navigation, from the site's folders | strong-agent | S | `cms.generate` |
| `cms.i18n` | Multilingual editing: one entry per language, linked by `translation_key` | strong-agent | S | `cms.collections` |
| `cms.rtl` | Right-to-left editing: fields switch direction by the entry's language | free-agent | S | `cms.preview` |
| `cms.blocks` | Editor components for the content blocks, inserting the same include an agent would | strong-agent | M | `cms.collections`, `cms.rtl` |
| `cms.preview` | Preview with the theme's tokens and fonts | free-agent | S | `cms.admin` |
| `cms.validate` | Saving checks front matter against the same schemas as the doctor and refuses invalid values | strong-agent | S | `cms.i18n` |
| `cms.auth-guide` | `site/guides/cms.md`: set up GitHub sign-in for the CMS step by step | free-agent | S | `cms.adr` |
| `cms.starter` | The blog and docs starters ship the CMS turned off, with one line to turn it on | free-agent | XS | `cms.collections` |

### Exit criteria
- [ ] A person edits a post in the browser on the blog starter, and the commit passes `slipway doctor`.


## Epic: Content blocks, round three
<!-- slipway-roadmap-key: E-blocks-3 -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

### Outcome
Twelve more blocks cover landing pages, technical writing, and audio, each readable without JavaScript and correct right to left.

### Scope
- One block per task: `_includes/blocks/<name>.html`, `assets/css/components/<name>.css`, `site/blocks/<name>.md`, and `tools/theme/block-<name>.test.mjs`

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `block3.guide` | Block author guide and a test that every block has an include, a stylesheet when it has styles, a docs page, and a test | free-agent | S | none |
| `block3.hero` | Hero block: headline, lead, two actions, and an optional image | free-agent | S | `block3.guide` |
| `block3.code-group` | Code group: the same example in several languages or package managers, as tabs that stack without JavaScript | free-agent | S | `block3.guide` |
| `block3.annotations` | Code annotations: numbered markers in a code block with notes below it | free-agent | S | `block3.guide` |
| `block3.diff` | Diff block: before and after code with added and removed lines marked by more than color | free-agent | S | `block3.guide` |
| `block3.chart` | Bar chart block from `_data`, drawn in CSS with a data table as the fallback | free-agent | S | `block3.guide` |
| `block3.people` | People grid from `_data/authors.yml` or a list, with roles and links | free-agent | S | `block3.guide` |
| `block3.testimonial` | Testimonial block: quote, person, role, and avatar | free-agent | S | `block3.guide` |
| `block3.pricing` | Pricing table: plans, features, and a highlighted plan | free-agent | S | `block3.guide` |
| `block3.logos` | Logo cloud that keeps contrast in dark mode | free-agent | S | `block3.guide` |
| `block3.audio` | Audio block for podcasts: native player, transcript, and chapters | free-agent | S | `block3.guide` |
| `block3.citation` | Citation block: a reference list and an in-text cite include | free-agent | S | `block3.guide` |
| `block3.download` | Download block: file name, size, checksum, and a button | free-agent | S | `block3.guide` |

### Exit criteria
- [ ] Every block renders in the showcase in LTR and RTL and passes the accessibility checks.


## Epic: Content blocks
<!-- slipway-roadmap-key: E-blocks -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

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
| `block.showcase` | Kitchen-sink page in the examples that renders every block in LTR and RTL | free-agent | S | `block.callout`, `block.tabs` |

### Exit criteria
- [ ] Every block renders in LTR and RTL with JavaScript off, and an invalid block option fails the schema check.


## Epic: Content blocks, round two
<!-- slipway-roadmap-key: E-blocks-2 -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

### Outcome
Ten more blocks for the pages people actually write (timelines, file trees, comparisons, endpoints), each a separate set of files so they can be built at the same time.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `block.timeline` | Timeline block: dated events, vertical on narrow screens | free-agent | S | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.file-tree` | File tree block: a folder structure with notes per file | free-agent | S | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.kbd` | Keyboard shortcut block: `kbd` keys with platform variants | free-agent | XS | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.compare` | Comparison block: pros and cons, or a feature matrix with yes, no, and partial | free-agent | S | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.pull-quote` | Pull quote block: editorial quote with attribution, in the theme's display serif | free-agent | XS | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.banner` | Announcement banner: a site-wide notice from `_data/banner.yml`, dismissible with JavaScript | strong-agent | S | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.stats` | Stat tiles block: a row of numbers with labels and optional trend | free-agent | S | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.endpoint` | API endpoint block: method, path, parameters, and an example response | strong-agent | S | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.gallery` | Gallery block: a responsive image grid with captions, CSS only | free-agent | S | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |
| `block.badge` | Badge block: inline status labels (stable, beta, deprecated, new) | free-agent | XS | `ext.blocks`, `parallel.css-components`, `parallel.sorted` |

### Exit criteria
- [ ] Every new block renders in LTR and RTL with JavaScript off, and an invalid option fails the schema check.


## Epic: Blogging and publishing
<!-- slipway-roadmap-key: E-publishing -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

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
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

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


## Epic: Multilingual and right-to-left excellence
<!-- slipway-roadmap-key: E-i18n -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

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


## Epic: More right-to-left languages
<!-- slipway-roadmap-key: E-rtl-2 -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

### Outcome
Every major right-to-left script and language has built-in UI strings and a font stack, and tests catch mirroring mistakes in any language.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `i18n.ur` | Urdu (`ur`): UI strings, font stack, and a right-to-left test | free-agent | S | `parallel.i18n-split`, `parallel.sorted` |
| `i18n.ckb` | Central Kurdish (Sorani) (`ckb`): UI strings, font stack, and a right-to-left test | free-agent | S | `parallel.i18n-split`, `parallel.sorted` |
| `i18n.ps` | Pashto (`ps`): UI strings, font stack, and a right-to-left test | free-agent | S | `parallel.i18n-split`, `parallel.sorted` |
| `i18n.sd` | Sindhi (`sd`): UI strings, font stack, and a right-to-left test | free-agent | S | `parallel.i18n-split`, `parallel.sorted` |
| `i18n.ug` | Uyghur (`ug`): UI strings, font stack, and a right-to-left test | free-agent | S | `parallel.i18n-split`, `parallel.sorted` |
| `i18n.dv` | Dhivehi (`dv`): UI strings, font stack, and a right-to-left test | free-agent | S | `parallel.i18n-split`, `parallel.sorted` |
| `i18n.yi` | Yiddish (`yi`): UI strings, font stack, and a right-to-left test | free-agent | S | `parallel.i18n-split`, `parallel.sorted` |
| `i18n.pseudo-rtl` | Pseudo-RTL run: every example rendered with `dir="rtl"` to catch mirroring bugs | strong-agent | S | `parallel.merge-safe`, `parallel.tmp-root` |
| `i18n.mirror-icons` | Directional icons mirror in right-to-left; others never do, checked by a test | free-agent | S | `parallel.merge-safe`, `evergreen.large-section`, `block.banner` |
| `doctor.lang-mismatch` | Check: a page's text is in a different script than its `lang` says | strong-agent | S | `parallel.doctor-registry` |

### Exit criteria
- [ ] Seven more right-to-left languages pass `slipway doctor` with no right-to-left findings, and the pseudo-RTL run finds no mirroring bug in the examples.


## Epic: The spec beyond Jekyll
<!-- slipway-roadmap-key: E-adapters -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

### Outcome
The agent-editable spec works outside Jekyll: adapters for the most used static site generators emit the same files, and `slipway doctor` checks them in CI.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `astro.adapter-design` | Design the Astro adapter on the framework-neutral content model | strong-agent | M | `spike.content-model` |
| `adapter.astro` | Astro integration that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | strong-agent | M | `spec.levels`, `astro.adapter-design` |
| `adapter.hugo` | Hugo module that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | strong-agent | M | `spec.editable`, `spec.levels` |
| `adapter.docusaurus` | Docusaurus plugin that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | strong-agent | M | `spec.editable`, `spec.levels` |
| `adapter.mkdocs` | MkDocs plugin that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | strong-agent | M | `spec.editable`, `spec.levels` |
| `adapter.eleventy` | Eleventy plugin that emits `sourcemap.json`, Markdown twins, and `AGENTS.md` | free-agent | S | `spec.editable`, `spec.levels` |
| `adapter.fixtures` | A fixture site per generator, checked by `slipway doctor` in CI | strong-agent | S | `doctor.detect`, `adapter.astro` |
| `adapter.css` | Slipway's tokens and CSS as a framework-neutral npm package | strong-agent | M | `theme.tokens` |
| `adapter.guide` | Guide: make any generator conform to the spec, level by level | free-agent | S | `adapter.astro`, `adapter.hugo` |
| `adapter.list` | Adapter list on the spec site, added by pull request | free-agent | XS | `spec.site` |

### Exit criteria
- [ ] Astro, Hugo, and Docusaurus fixture sites reach spec level L2 in `slipway doctor`.


## Epic: Recipes, round two
<!-- slipway-roadmap-key: E-recipes -->
> **Epic** · **Phase:** v0.6 — Content and languages (2026-11-16 → 2026-12-20)

### Outcome
Short, tested answers to the hosting and integration questions site owners ask, each one new file in `site/recipes/`.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `recipe.gitlab-pages` | Recipe: deploy a Slipway site to GitLab Pages | free-agent | S | `parallel.docs-autonav` |
| `recipe.codeberg-pages` | Recipe: deploy to Codeberg Pages | free-agent | S | `parallel.docs-autonav` |
| `recipe.vercel` | Recipe: deploy to Vercel | free-agent | S | `parallel.docs-autonav` |
| `recipe.redirects` | Recipe: redirects when pages move, with `jekyll-redirect-from` | free-agent | S | `parallel.docs-autonav` |
| `recipe.forms` | Recipe: contact forms on a static site (Formspree, Netlify Forms, Basin) | free-agent | S | `parallel.docs-autonav` |
| `recipe.pagefind` | Recipe: Pagefind search for large sites in Actions mode | free-agent | S | `parallel.docs-autonav` |
| `recipe.versioned-docs` | Recipe: versioned documentation on GitHub Pages (folders per version) | free-agent | S | `parallel.docs-autonav` |
| `recipe.docs-folder` | Recipe: a documentation site in a code repository's `docs/` folder | free-agent | S | `parallel.docs-autonav`, `evergreen.subfolder` |
| `recipe.rel-me` | Recipe: `rel="me"` links and Mastodon verification | free-agent | S | `parallel.docs-autonav` |
| `recipe.from-pages-themes` | Guide: move a site from a GitHub Pages built-in theme (minimal, cayman, …) to Slipway | free-agent | S | `parallel.docs-autonav`, `evergreen.switch` |

### Exit criteria
- [ ] Ten new recipes on the docs site, each with a passing snippet test.


---

# v1.0 — Proof, quality, and launch (2026-12-21 → 2027-01-17)

## Epic: Accessibility, performance, and browsers
<!-- slipway-roadmap-key: E-quality -->
> **Epic** · **Phase:** v1.0 — Proof, quality, and launch (2026-12-21 → 2027-01-17)

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


## Epic: Quality gates, round two
<!-- slipway-roadmap-key: E-quality-2 -->
> **Epic** · **Phase:** v1.0 — Proof, quality, and launch (2026-12-21 → 2027-01-17)

### Outcome
The accessibility and robustness claims extend to forced colors, zoom, long strings, motion, and code highlighting, each its own check folder.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `qa.forced-colors` | Forced-colors mode: focus, borders, and icons stay visible in Windows High Contrast | strong-agent | S | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.reflow` | Reflow at 320 CSS pixels and 400% zoom: no horizontal scrolling of the page | free-agent | S | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.text-spacing` | Text spacing override (WCAG 1.4.12) clips no text | free-agent | S | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.pseudo-loc` | Pseudo-localized UI strings 40% longer break no header, navigation, or button | free-agent | S | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.page-weight` | Page-weight budget per example: HTML, CSS, JavaScript, and fonts | free-agent | S | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.include-snapshots` | HTML snapshot tests for every include with fixed inputs | strong-agent | M | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.anchors` | Every table-of-contents and in-page link targets an existing `id` | free-agent | S | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.reduced-motion` | `prefers-reduced-motion: reduce` turns off every transition and animation | free-agent | XS | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.code-contrast` | Syntax highlighting tokens pass contrast in light and dark | free-agent | S | `parallel.merge-safe`, `parallel.tmp-root` |
| `qa.schema-fuzz` | Schema fuzzing: random valid config and front matter never break the build | strong-agent | M | `parallel.merge-safe`, `parallel.tmp-root` |

### Exit criteria
- [ ] Ten new checks run in `npm run check` and pass on every example in light, dark, LTR, and RTL.


## Epic: Starters
<!-- slipway-roadmap-key: E-starters -->
> **Epic** · **Phase:** v1.0 — Proof, quality, and launch (2026-12-21 → 2027-01-17)

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


## Epic: More starters
<!-- slipway-roadmap-key: E-starters-2 -->
> **Epic** · **Phase:** v1.0 — Proof, quality, and launch (2026-12-21 → 2027-01-17)

### Outcome
Ten more ready-made sites for the niches people ask for, each in its own folder under `starters/`.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `starter.tool` | Developer tool starter: landing page, docs, CLI reference, changelog (shaped like Evergreen) | strong-agent | M | `parallel.merge-safe`, `evergreen.fixture` |
| `starter.handbook` | Team handbook starter: policies, onboarding, and an owner per page | free-agent | S | `parallel.merge-safe` |
| `starter.course` | Course starter: lessons, modules, progress order, and exercises | free-agent | S | `parallel.merge-safe` |
| `starter.event` | Event starter: schedule, speakers, venue, and code of conduct | free-agent | S | `parallel.merge-safe` |
| `starter.resume` | Résumé starter: one page that prints well, in English and Persian | free-agent | S | `parallel.merge-safe` |
| `starter.newsletter` | Newsletter archive starter: issues, subscribe form, and a feed | free-agent | S | `parallel.merge-safe` |
| `starter.podcast` | Podcast starter: episodes, show notes, and a podcast RSS feed | strong-agent | S | `parallel.merge-safe` |
| `starter.garden` | Digital garden starter: notes with backlinks and growth stages | strong-agent | S | `parallel.merge-safe` |
| `starter.nonprofit` | Nonprofit starter: mission, programs, reports, and donate links | free-agent | S | `parallel.merge-safe` |
| `starter.links` | Link page starter: one page of links, an avatar, and social icons | free-agent | XS | `parallel.merge-safe` |

### Exit criteria
- [ ] Every new starter builds, passes the quality checks, and reaches the top level in `slipway doctor`.


## Epic: Proof, feedback, and growth
<!-- slipway-roadmap-key: E-growth -->
> **Epic** · **Phase:** v1.0 — Proof, quality, and launch (2026-12-21 → 2027-01-17)

### Outcome
Public evidence that Slipway helps agents, real users and their feedback before 1.0, measured installs, and a business model that keeps the core free.

### Scope
- `growth.dogfood`, `growth.feedback`, and `growth.business` have no dependencies and can start any time

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


## Epic: Launch
<!-- slipway-roadmap-key: E-launch -->
> **Epic** · **Phase:** v1.0 — Proof, quality, and launch (2026-12-21 → 2027-01-17)

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

# v1.1 — Seaworthy integration (2027-01-18 → 2027-02-14)

## Epic: Seaworthy integration
<!-- slipway-roadmap-key: E-seaworthy -->
> **Epic** · **Phase:** v1.1 — Seaworthy integration (2027-01-18 → 2027-02-14)

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
| `seaworthy.fixtures` | The starters run as clean fixtures in Seaworthy's CI | strong-agent | S | `starter.docs`, `starter.blog`, `starter.portfolio`, `starter.project`, `starter.bilingual`, `starter.academic` |
| `launch.demo-video` | Demo: an agent builds a site from a starter, Seaworthy catches a problem on the Markdown line, the agent fixes it | maintainer | M | `sourcemap.e2e` |
| `launch.co-launch` | Co-launch day with Seaworthy wave 2 | maintainer | M | `launch.posts` |

### Exit criteria
- [ ] A Seaworthy finding on a Slipway site points at the Markdown source and line, in Seaworthy's report and in GitHub annotations.
- [ ] Seaworthy dependencies are met: the Action ([#88](https://github.com/arminazimi/seaworthy/issues/88)), badge ([#90](https://github.com/arminazimi/seaworthy/issues/90)), MCP `verify_site` ([#77](https://github.com/arminazimi/seaworthy/issues/77)), source maps ([#381](https://github.com/arminazimi/seaworthy/issues/381), [#197](https://github.com/arminazimi/seaworthy/issues/197)), theme fixtures ([#383](https://github.com/arminazimi/seaworthy/issues/383)), and the theme consumer task ([#354](https://github.com/arminazimi/seaworthy/issues/354)).


---

# v1.2 — Ecosystem and spec 1.0 (2027-02-15 → 2027-03-14)

## Epic: The spec on more generators
<!-- slipway-roadmap-key: E-adapters-2 -->
> **Epic** · **Phase:** v1.2 — Ecosystem and spec 1.0 (2027-02-15 → 2027-03-14)

### Outcome
The agent-editable spec works on nine more static site generators, each adapter in its own folder with a fixture that `slipway doctor` checks.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `adapter.vitepress` | VitePress adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | strong-agent | M | `parallel.merge-safe` |
| `adapter.starlight` | Astro Starlight adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | strong-agent | M | `parallel.merge-safe` |
| `adapter.zola` | Zola adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | strong-agent | M | `parallel.merge-safe` |
| `adapter.mdbook` | mdBook adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | strong-agent | M | `parallel.merge-safe` |
| `adapter.hexo` | Hexo adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | free-agent | M | `parallel.merge-safe` |
| `adapter.quarto` | Quarto adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | strong-agent | M | `parallel.merge-safe` |
| `adapter.sphinx` | Sphinx (MyST) adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | strong-agent | M | `parallel.merge-safe` |
| `adapter.pelican` | Pelican adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | strong-agent | M | `parallel.merge-safe` |
| `adapter.nextra` | Nextra adapter that emits `sourcemap.json`, Markdown twins, and `data-source` on headings | strong-agent | M | `parallel.merge-safe` |
| `adapter.detect-more` | `slipway doctor` detects the new generators and their source and output folders | free-agent | S | `adapter.vitepress`, `adapter.starlight`, `adapter.zola`, `adapter.mdbook`, `adapter.hexo`, `adapter.quarto`, `adapter.sphinx`, `adapter.pelican`, `adapter.nextra` |

### Exit criteria
- [ ] Every new adapter's fixture reaches L2 in `slipway doctor` when its generator is installed, and `slipway doctor` detects each generator.


## Epic: Migration
<!-- slipway-roadmap-key: E-migration -->
> **Epic** · **Phase:** v1.2 — Ecosystem and spec 1.0 (2027-02-15 → 2027-03-14)

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


## Epic: Extensions
<!-- slipway-roadmap-key: E-extensions -->
> **Epic** · **Phase:** v1.2 — Ecosystem and spec 1.0 (2027-02-15 → 2027-03-14)

### Outcome
Slipway grows through community blocks and presets, not core changes.

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| `ext.community` | Community block and preset list, submitted by pull request | free-agent | S | `ext.blocks` |

### Exit criteria
- [ ] An external repository publishes a block that works in a Slipway site with one line of config.


## Epic: Spec 1.0
<!-- slipway-roadmap-key: E-standard -->
> **Epic** · **Phase:** v1.2 — Ecosystem and spec 1.0 (2027-02-15 → 2027-03-14)

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

| Metric | 1.0 | 1.2 (month 6) | Month 12 target |
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
