# Changelog

All notable changes to Slipway are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/) for the public API in [ADR 0012](docs/adr/0012-public-api.md). Pin a release with `remote_theme: arminazimi/slipway@v<version>`.

Add a line under `Unreleased` in the pull request that makes the change. `node tools/release/prepare.mjs <version>` turns `Unreleased` into a release ([CONTRIBUTING.md](CONTRIBUTING.md#releasing)).

## [Unreleased]

### Added

- Theme layout that works as a gem, through `remote_theme`, and after "Use this template" (#41).
- Design tokens with a desert rose palette, mapped from `_config.yml` to CSS variables with a JSON Schema (#4).
- Dark mode without a flash and a manual toggle (#5).
- Editorial signature with self-hosted Latin and Persian fonts and numbered sections (#7).
- WCAG AA contrast tests for every text token pair in light and dark (#56).
- Print stylesheet (#57).
- Layouts: `default` with landmarks, skip link, and theme toggle (#10), `home` (#11), `doc` with sidebar, table of contents, and pager (#12), `post` (#13), and `page` (#14).
- Code block styles and a copy button (#15).
- Translated UI strings, `dir` derived from `lang`, and a language switcher (#17).
- Opt-in Persian type, digits, and Jalali dates (#18).
- Client-side search with a per-language index (#19).
- Navigation from `_data/navigation.yml`, validated by a schema (#58).
- Tags, categories, and archive pages (#59).
- Atom feed per language and a sitemap with `hreflang` (#60).
- A 404 page with a section for every language (#61).
- Example sites: `minimal`, `docs`, `blog`, and `persian` (#9).
- `sourcemap.json` format v0 and its schema (#66).
- A schema for every `_config.yml` key the theme reads (#71).
- Documented override slots: `head-custom.html`, `footer-custom.html`, and `custom.css`.
- The public API under semver and the deprecation policy (ADR 0012, #172).
- A release workflow, `CHANGELOG.md`, and `tools/release/prepare.mjs` (#174).
- Build-time warnings for renamed config keys and front-matter fields, naming the replacement; the old names keep working (#173).

### Fixed

- Quotes in font stack overrides are kept (#134).

[Unreleased]: https://github.com/arminazimi/slipway/commits/main
