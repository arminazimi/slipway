---
title: Roadmap
description: The public roadmap, milestone by milestone, with every epic and the outcome it delivers.
layout: doc
permalink: /roadmap/
---
<!-- Generated from ROADMAP.md by planning/roadmap/page.mjs. Do not edit by hand. -->

The plan behind Slipway, milestone by milestone. [ROADMAP.md](https://github.com/arminazimi/slipway/blob/main/ROADMAP.md) is the source of truth; this page is generated from it. Every epic is a tracking issue, and every task is one pull request that adds a small, independently reviewable change. New here? [CONTRIBUTING.md](https://github.com/arminazimi/slipway/blob/main/CONTRIBUTING.md) explains how to claim one.

## Phase 0 — Foundations and feasibility spikes (2026-10-18 → 2026-10-19)

3 epics · 17 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22Phase%200%20%E2%80%94%20Foundations%20and%20feasibility%20spikes%22%20label%3A%22type%3A%20task%22)

### Repository, CI, and contribution lanes

A repository agents and humans can contribute to on day one, whose CI already runs Seaworthy on the example site.

**8 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-foundation%22)

### Feasibility spikes

Answer the questions that decide the architecture before building on them. Each spike ends in an ADR.

**5 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-spikes%22)

### Brand

Slipway's identity, in the same family as Seaworthy: "Build on Slipway. Ship Seaworthy."

**4 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-brand%22)

## Phase 1 — Core theme (2026-10-20 → 2026-10-25)

Release `0.1.0-alpha.1` · 2 epics · 22 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22Phase%201%20%E2%80%94%20Core%20theme%22%20label%3A%22type%3A%20task%22)

### Theme design tokens and editorial type system

An editorial theme where every visual decision is a CSS custom property, restyled from `_config.yml` without editing CSS.

**7 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-theme-tokens%22)

### Theme layouts and RTL

Layouts for home, docs, posts, and pages, with right-to-left and multilingual support built in, not bolted on.

**15 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-theme-layouts%22)

## Phase 2a — Parallel-safe contributions (2026-10-28 → 2026-11-15)

1 epic · 10 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22Phase%202a%20%E2%80%94%20Parallel-safe%20contributions%22%20label%3A%22type%3A%20task%22)

### Parallel-safe contributions

Fifteen agents (for example Jules sessions) can work on fifteen issues at once, and their pull requests merge in any order: no shared changelog, script list, registry, or string file forces a conflict.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-parallel%22)

## v0.2 — Standalone theme, the spec, and Evergreen (2026-10-26 → 2026-11-01)

Release `0.2.0` (Evergreen pins it) · 6 epics · 45 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v0.2%20%E2%80%94%20Standalone%20theme%2C%20the%20spec%2C%20and%20Evergreen%22%20label%3A%22type%3A%20task%22)

### Install anywhere, upgrade safely

Any project adds Slipway with one line, pins a version, and upgrades without surprises: the public API is defined, versioned, and tested.

**9 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-standalone%22)

### The agent-editable site spec and `slipway doctor`

An open spec says what a site publishes so an agent can edit it safely, and `slipway doctor` checks any static site against it, with findings on the source file and line and in formats agents and CI read.

**11 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-spec%22)

### Content and config schemas

Agents can create and edit content safely: every config key and every front-matter field is described by a JSON Schema and validated in CI.

**4 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-schemas%22)

### Source maps

Slipway's signature: every site publishes which source file and line produced each page and section, so `slipway doctor`, the edit button, and agents point at the Markdown file to edit, not at the built HTML.

**4 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-source-map%22)

### Agent interface

Agents build, edit, and check Slipway sites as first-class users: instructions travel with every site, and tools exist for every common change.

**6 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-agent-interface%22)

### Evergreen's site on Slipway

Evergreen's GitHub Pages site (arminazimi.github.io/evergreen) runs on Slipway, pinned to a release: its hand-written pages without front matter, its 500+ generated rule pages, its dashboard, and its own `llms.txt` and sitemap all keep working at the same URLs, and Evergreen's CI checks the site with `slipway doctor`.

**11 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-evergreen%22)

## v0.3 — Ready to scale (2026-10-30 → 2026-11-08)

Release `0.3.0` · 5 epics · 71 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v0.3%20%E2%80%94%20Ready%20to%20scale%22%20label%3A%22type%3A%20task%22)

### CI that scales to fifteen agents

CI is fast, safe, and strict enough that fifteen agent pull requests a day merge without breaking `main`, and every pull request shows what it changed in size, levels, and pixels.

**16 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-ci%22)

### Agent operations

Ready tasks reach agents without a person in the loop: the repository marks what is ready, hands it to Jules within a concurrency limit, keeps agent pull requests current, and reports throughput weekly.

**12 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-agent-ops%22)

### Slipway's own site on GitHub Pages

Slipway's own site on GitHub Pages is the best demo: built from the theme in the same commit, with every example and block live, checked at the top level by its own doctor, and the reference for every public API item 1.0 promises to keep.

**22 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-docs-site%22)

### Supply-chain security

Anyone can verify that a Slipway release was built from this repository by its release workflow, and the repository scores 8 or more on the OpenSSF Scorecard.

**11 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-supply-chain%22)

### Dependency lifecycle with Evergreen

Slipway and the sites built with it find end-of-life runtimes, gems, packages, and Actions before they break a build, using Evergreen optionally, the way Slipway uses Seaworthy.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-lifecycle%22)

## v0.4 — Docs platform (2026-11-05 → 2026-11-22)

Release `0.4.0` · 5 epics · 59 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v0.4%20%E2%80%94%20Docs%20platform%22%20label%3A%22type%3A%20task%22)

### Code reference from source

A project like Evergreen publishes the best reference for its own code: every module, function, type, and endpoint gets a page generated from its source, linked to the exact line, searchable, and readable by agents.

**14 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-codedocs%22)

### Docs hosting for any repository

Any repository with a `docs/` folder gets a versioned documentation site on GitHub Pages from one small file and one workflow, and Slipway becomes a default place open-source projects host their docs.

**12 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-docs-host%22)

### Product documentation kit

Everything a developer tool's documentation needs beyond pages (CLI reference, changelog, schema tables, decision records, status banners), learned from moving Evergreen.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-docs-kit%22)

### Diagrams

Diagrams are written as text (Mermaid or D2), drawn at build time where the mode allows, themed by the design tokens, readable in right-to-left languages, and always come with a text alternative that agents read.

**12 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-diagrams%22)

### Social cards

Every page gets a social card made from its title and the site's design tokens, in every language, so shared links look designed without anyone opening an image editor.

**11 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-og%22)

## v0.5 — Agents everywhere (2026-11-09 → 2026-12-06)

Release `0.5.0` · 9 epics · 91 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v0.5%20%E2%80%94%20Agents%20everywhere%22%20label%3A%22type%3A%20task%22)

### More Agent Skills

An agent on a Slipway site has a skill for every common job, each tested so its paths and commands exist and its description triggers on the requests it is for.

**12 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-skills%22)

### Skills where agents look

Slipway's skills install with one command from every place agents look for them, and installs grow from a handful to thousands, counted weekly.

**13 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-skill-reach%22)

### GitHub Actions suite

One `uses:` line builds, checks, previews, and deploys any Slipway site, and every pull request on such a site shows what changed for agents.

**12 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-action%22)

### Discoverable by agents

An agent working on any static site finds Slipway's tools without searching: in the MCP Registry, the skill and plugin marketplaces, GitHub Marketplace, and agent documentation indexes.

**9 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-agent-reach%22)

### MCP tools, round three

An agent finds, reads, moves, and checks content through the MCP server by file and line, without reading the whole site.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-mcp-3%22)

### Node-only site tooling

`npx slipway <command>` does the common site chores (new pages, navigation, translations, stubs, twins, source maps, pinning) with Node alone, so agents in a bare environment need no Ruby.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-cli%22)

### Doctor checks, round two

`slipway doctor` catches the mistakes agents actually make when editing a site (stale instructions, stale source maps, edits to generated pages, unknown keys) and explains each finding.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-doctor-checks%22)

### Agent tooling, round two

The first agent tools (Phase 2) get their second layer: MCP editing tools, plugins, WebMCP, a badge, `--fix`, CI recipes, and the first outreach and migration guide.

**8 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-agent-tooling%22)

### Theme agent-readable output

Every Slipway site is readable by agents out of the box: `llms.txt`, a Markdown twin of every page, and structured data.

**7 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-theme-ai%22)

## v0.6 — Content and languages (2026-11-16 → 2026-12-20)

Release `0.6.0` · 12 epics · 139 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v0.6%20%E2%80%94%20Content%20and%20languages%22%20label%3A%22type%3A%20task%22)

### Persian and Arabic typography checks

`slipway doctor` catches and fixes the typography mistakes that make Persian and Arabic text look careless (missing zero-width non-joiners, Arabic yeh and kaf in Persian, mixed digits, Latin punctuation), and never touches code.

**11 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-persian-type%22)

### Interface in 40 languages

The theme's interface strings exist in 40 languages, each complete and checked, so most readers see Slipway in their own language.

**23 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-ui-languages%22)

### Visual editing

People who do not write code can edit a Slipway site in the browser with a CMS whose fields come from the same schemas agents use, so both stay valid.

**11 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-cms%22)

### Content blocks, round three

Twelve more blocks cover landing pages, technical writing, and audio, each readable without JavaScript and correct right to left.

**13 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-blocks-3%22)

### Content blocks

A library of content blocks that work without JavaScript, look right in right-to-left, and have a schema each, so agents insert them without guessing.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-blocks%22)

### Content blocks, round two

Ten more blocks for the pages people actually write (timelines, file trees, comparisons, endpoints), each a separate set of files so they can be built at the same time.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-blocks-2%22)

### Blogging and publishing

Everything a real blog or publication needs, without plugins outside the GitHub Pages list.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-publishing%22)

### Design system and customization

A site looks like its owner's, not like a theme demo, through config alone: variants, presets, logos, and palettes.

**11 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-design%22)

### Multilingual and right-to-left excellence

The best right-to-left and multilingual support of any static theme: Persian, Arabic, and Hebrew look designed, and agents translate pages without breaking links.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-i18n%22)

### More right-to-left languages

Every major right-to-left script and language has built-in UI strings and a font stack, and tests catch mirroring mistakes in any language.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-rtl-2%22)

### The spec beyond Jekyll

The agent-editable spec works outside Jekyll: adapters for the most used static site generators emit the same files, and `slipway doctor` checks them in CI.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-adapters%22)

### Recipes, round two

Short, tested answers to the hosting and integration questions site owners ask, each one new file in `site/recipes/`.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-recipes%22)

## v1.0 — Proof, quality, and launch (2026-12-21 → 2027-01-17)

Release `1.0.0` · 6 epics · 55 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v1.0%20%E2%80%94%20Proof%2C%20quality%2C%20and%20launch%22%20label%3A%22type%3A%20task%22)

### Accessibility, performance, and browsers

The quality claims are tested, not stated: accessibility, performance, valid HTML, and every major browser, in light, dark, and RTL.

**12 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-quality%22)

### Quality gates, round two

The accessibility and robustness claims extend to forced colors, zoom, long strings, motion, and code highlighting, each its own check folder.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-quality-2%22)

### Starters

Ready-made sites for the niches that grow theme ecosystems (the most-starred Jekyll themes are academic sites), each at the top spec level.

**7 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-starters%22)

### More starters

Ten more ready-made sites for the niches people ask for, each in its own folder under `starters/`.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-starters-2%22)

### Proof, feedback, and growth

Public evidence that Slipway helps agents, real users and their feedback before 1.0, measured installs, and a business model that keeps the core free.

**12 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-growth%22)

### Launch

Slipway 1.0: a stable theme and an open spec, launched in English and Persian.

**4 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-launch%22)

## v1.1 — Seaworthy integration (2027-01-18 → 2027-02-14)

Release `1.1.0` · 1 epic · 10 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v1.1%20%E2%80%94%20Seaworthy%20integration%22%20label%3A%22type%3A%20task%22)

### Seaworthy integration

"Build on Slipway. Ship Seaworthy.": Slipway sites can add Seaworthy's checks with one line, and Seaworthy's findings point at the Markdown line through Slipway's source maps.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-seaworthy%22)

## v1.2 — Ecosystem and spec 1.0 (2027-02-15 → 2027-03-14)

Release `1.2.0` + Spec 1.0 · 4 epics · 17 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v1.2%20%E2%80%94%20Ecosystem%20and%20spec%201.0%22%20label%3A%22type%3A%20task%22)

### The spec on more generators

The agent-editable spec works on nine more static site generators, each adapter in its own folder with a fixture that `slipway doctor` checks.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-adapters-2%22)

### Migration

The fastest way into Slipway is from the themes people already use: an agent moves the site with one command.

**5 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-migration%22)

### Extensions

Slipway grows through community blocks and presets, not core changes.

**1 task** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-extensions%22)

### Spec 1.0

The agent-editable spec reaches 1.0 through RFCs, with conformance levels that Seaworthy also verifies.

**1 task** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-standard%22)
