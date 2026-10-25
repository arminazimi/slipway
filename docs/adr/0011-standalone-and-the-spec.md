# 0011. Slipway 1.0 is standalone: a theme and an agent-editable site spec; Seaworthy integration follows in 1.1

**Status:** Accepted (2026-10-25). Changes decision 4 of [ADR 0001](0001-why-slipway.md) for releases before 1.1.

## Context

ADR 0001 tied Slipway's roadmap to Seaworthy: verification by Seaworthy was a product principle, and ten tasks waited on Seaworthy deliverables. The maintainer wants to use Slipway in other projects now, which needs a theme that installs with one line, pins a version, and does not wait on another project's releases.

A review of the plan against the maintainer's product goals (used by most coding agents, verifies instead of advising, discoverable through MCP and Agent Skills, part of every pipeline, an ecosystem standard, a real business) found that a Jekyll theme alone meets few of them: it is seen only on Jekyll sites, it checks nothing, and it has no place in a pipeline.

## Decision

1. **Slipway is two things.** A standalone theme, and an open spec for agent-editable sites with a checker, `slipway doctor`, that works on any static site generator. The theme is the spec's reference implementation.
2. **The line with Seaworthy.** Seaworthy asks "is this site healthy and readable by agents?" (links, accessibility, agent readability). Slipway's spec asks "can an agent edit this site safely?" (source maps, schemas, `AGENTS.md`, edit prompts). `slipway doctor` does not repeat Seaworthy's generic checks.
3. **1.0 is standalone.** Nothing a site needs before 1.0 depends on Seaworthy. Tasks that wait on a Seaworthy deliverable move to Phase 6 (`1.1.0`). Slipway's own CI keeps running Seaworthy, pinned to a commit, as a regression net.
4. **Slipway owns `sourcemap.json`.** The format is written close to Seaworthy's `spec/source-map/v0` draft, so Seaworthy reads it in 1.1 without a second format.
5. **1.0 means `1.0.0` with a semver contract** on config keys, front-matter fields, layouts, include names, and CSS tokens.

## Consequences

- The roadmap gains epics for standalone install, the spec and doctor, adapters for other generators, agent discoverability, and proof and growth, and keeps the theme epics.
- The spec must stay small enough for other generators to adopt; adapters for Astro, Hugo, and Docusaurus test that before 1.0.
- `doctor` and Seaworthy can drift into overlap. Any check that is not about editing goes to Seaworthy.
- The tagline "Build on Slipway. Ship Seaworthy." stays: it describes the path after 1.1.
