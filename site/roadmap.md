---
title: Roadmap
description: The public roadmap, milestone by milestone, with every epic and the outcome it delivers.
layout: doc
permalink: /roadmap/
---
<!-- Generated from ROADMAP.md by planning/roadmap/page.mjs. Do not edit by hand. -->

The plan behind Slipway, milestone by milestone. [ROADMAP.md](https://github.com/arminazimi/slipway/blob/main/ROADMAP.md) is the source of truth; this page is generated from it. Every epic is a tracking issue, and every task is one pull request that adds a small, independently reviewable change. New here? [CONTRIBUTING.md](https://github.com/arminazimi/slipway/blob/main/CONTRIBUTING.md) explains how to claim one.

## v0.3.0 — Docs engine and theme (2026-11-09 → 2027-01-31)

Release 0.3.0 · 12 epics · 204 tasks · [Search GitHub for this milestone's tasks](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20milestone%3A%22v0.3.0%20%E2%80%94%20Docs%20engine%20and%20theme%22%20label%3A%22type%3A%20task%22)

### Foundations and frozen contracts

The decisions behind 0.3.0 are written down, `packages/engine` and `packages/theme` exist as workspaces that build and test, the engine's contracts (content model, config, plugin, output, and render types) are frozen, and a shared Evergreen-shaped fixture exists. After this epic, up to 20 tasks can run at once without touching the same files.

**8 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-foundation%22)

### Engine core

`slipway build` turns a folder of Markdown and a `slipway.yml` into a static site model and renders it with the theme, with source positions kept on every block, diagnostics that point at file and line, and a dev server. It builds `fixtures/docs-site` (about 600 pages) without errors.

**30 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-engine%22)

### Engine outputs: HTML, search, and agent-ready files

From one site model, a build writes the HTML pages and every machine-readable file a docs site needs, all consistent with each other: sitemap, robots, 404, `llms.txt`, `llms-full.txt`, Markdown twins, a line-exact `sourcemap.json`, `AGENTS.md`, head metadata with JSON-LD, a Pagefind search index, redirects, and a build manifest. A site's own copies of these files win.

**18 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-outputs%22)

### Design system

Slipway has a new, docs-first design: a written brief based on Next.js, Tailwind, Stripe, Supabase, and Starlight docs; approved mockups of the home, guide, API, and mobile views; and tokens for color (light and dark), type, space, motion, states, code, and right-to-left, built into one CSS file, plus base prose styles.

**20 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-design%22)

### Doc layouts and page chrome

A three-column docs layout (sidebar, article, on-this-page) with a sticky header, section tabs, collapsible sidebar groups, a mobile drawer, a table of contents that follows the reader, breadcrumbs, a pager, a page footer with edit links, a ⌘K search dialog, and a theme switch, plus home, 404, and app-page layouts. Everything works without JavaScript except search and the switches.

**20 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-layouts%22)

### Content components

Authors have the components a docs site needs, written in Markdown: code blocks highlighted at build time with titles, line marks, diffs, copy buttons, and tabs that stay in sync across the page and site; terminals; callouts (GitHub alert syntax too); cards; steps; tables; file trees; details; figures; endpoints; schema tables; page status banners; heading anchors; and tabs. Each is one folder, styled only with tokens, and documented with an example in `fixtures/docs-site`.

**24 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-components%22)

### Quality gates

CI proves the acceptable-level criteria on every pull request: Lighthouse at least 95 in all four categories, zero axe violations, keyboard flows, JavaScript and CSS budgets, a build-time budget, visual regression, pages usable without JavaScript, valid HTML, no broken links, byte-identical builds, and an engine that knows nothing about the theme.

**15 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-quality%22)

### Tools off Jekyll: doctor, MCP, Skills, and setup

`slipway doctor`, the MCP server, the Agent Skills, `create-slipway`, the GitHub Actions, and the release tool work with engine sites: they read `slipway.yml` and the build manifest, not `_config.yml` or Jekyll output, and none of them needs Ruby.

**20 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-tooling%22)

### Evergreen on the engine

Evergreen's docs site (arminazimi.github.io/evergreen) is built by the engine with the new theme, deployed by the deploy Action, with every old URL working, its 500+ generated rule pages and dashboard intact, its own `llms.txt` and sitemap kept, and doctor in its CI. A one-command migration tool exists for any Slipway 0.2 site.

**14 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-evergreen%22)

### Slipway's own site on the engine

Slipway's documentation site is built by the engine with the new theme and deployed by the deploy Action. Its content covers only the docs product: install, configure, write, components, customize, deploy, migrate from 0.2, and references generated from the schemas.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-site%22)

### Remove Jekyll and everything that is not docs

The repository has one engine and one language: no Jekyll layouts, includes, plugins, Gemfiles, Ruby in CI, or `remote_theme` docs; no blog layouts, non-docs starters, examples, or marketing blocks. The last Jekyll version stays reachable through a tag and a branch for sites pinned to `v0.2.0`.

**15 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-cleanup%22)

### Documentation and the 0.3.0 release

The repository's own documents describe the engine and the docs theme, users of 0.2 have a tested upgrade path, the changelog is clean, and `0.3.0` is released on GitHub and npm.

**10 tasks** · [Epic issue](https://github.com/arminazimi/slipway/issues?q=is%3Aissue%20%22slipway-roadmap-key%3A%20E-release%22)
