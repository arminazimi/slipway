---
title: Changelog
description: Every Orbit release and what changed in it.
layout: changelog
permalink: /changelog/
---

# Changelog

## 0.3.0 — 2026-10-14

### Added

- `orbit rollback --to <release>`, so a release does not have to be the previous one.
- `orbit status` prints the release message and its deploy time.

### Changed

- `orbit deploy` keeps five releases by default instead of two.

## 0.2.0 — 2026-09-02

### Added

- `orbit deploy --dry-run` lists the files that would change.
- `orbit logs` streams the current release's log.

## 0.1.0 — 2026-08-11

### Added

- `orbit init`, `orbit deploy`, and `orbit rollback`.
