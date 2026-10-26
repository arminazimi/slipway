# Changelog

All notable changes to Slipway are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/) for the public API in [ADR 0012](docs/adr/0012-public-api.md). Pin a release with `remote_theme: arminazimi/slipway@v<version>`.

Add a line under `Unreleased` in the pull request that makes the change. `node tools/release/prepare.mjs <version>` turns `Unreleased` into a release ([CONTRIBUTING.md](CONTRIBUTING.md#releasing)).

## [Unreleased]
- Added `translation-status` layout to show which pages exist in which language.

### Added
- `slipway.fonts: system` skips downloading web fonts and uses the reader's system typography (system-ui, and system Arabic). Persian text is shaped correctly and remains readable. (#216)
- Social links from `_data/social.yml` shown in the footer with an inline SVG icon set (#208).


- Motion tokens (`--sl-motion-fast`) and hover transitions on interactive elements, respecting `prefers-reduced-motion` (#218).
- Search: normalization covers more Arabic combining marks, ZWJ, and `ئ` and `ڪ` variants, so a Persian query typed with Arabic letters always finds the Persian page (#229).

- Docusaurus adapter: a plugin that writes `sourcemap.json`, Markdown twins, and `data-source` on headings, with starter `AGENTS.md` and content schemas (#234).
- Home variants, picked with `variant` in the front matter: `editorial` (the default), `landing` with `features` and a closing call to action, `blog` with every post, and `docs` with the docs navigation as cards; `posts_limit` sets how many posts show (#213).
- Post series: posts with the same `series` get a series box with their part, the other parts, and the previous and next part (#205).
- Page widths: `width: narrow`, `wide`, or `full` in the front matter, and `.sl-wide` and `.sl-bleed` sections inside the reading column (#214).
- A Markdown twin of every page at its address with `.md`, linked from the head: stubs from `npm run twins` on classic Pages, a plugin in Actions mode (#22).
- Theme layout that works as a gem, through `remote_theme`, and after "Use this template" (#41).
- Design tokens with a desert rose palette, mapped from `_config.yml` to CSS variables with a JSON Schema (#4).
- Dark mode without a flash and a manual toggle (#5).
- Editorial signature with self-hosted Latin and Persian fonts and numbered sections (#7).
- WCAG AA contrast tests for every text token pair in light and dark (#56).
- SEO and social meta in `<head>`: a canonical link, Open Graph, a Twitter card, and `hreflang` alternates of a page's translations, with no plugin. Replace `assets/images/social.png` to set the shared image (#202).
- Print stylesheet (#57).
- Layouts: `default` with landmarks, skip link, and theme toggle (#10), `home` (#11), `doc` with sidebar, table of contents, and pager (#12), `post` (#13), and `page` (#14).
- Code block styles and a copy button (#15).
- Translated UI strings, `dir` derived from `lang`, and a language switcher (#17).
- Opt-in Persian type, digits, and Jalali dates (#18).
- Client-side search with a per-language index (#19).
- Navigation from `_data/navigation.yml`, validated by a schema (#58).
- Tags, categories, and archive pages (#59).
- Atom feed per language and a sitemap with `hreflang` (#60).
- `llms.txt` and `llms-full.txt` layouts: a list of every page with its description for agents, and the text of every page in one file (#21).
- Related posts after each post: up to three in the same language that share the most tags, computed in Liquid (#206).
- Authors from `_data/authors.yml`: a byline, an author box after each post, several authors per post, and author pages with `layout: author` (#204).
- A 404 page with a section for every language (#61).
- Example sites: `minimal`, `docs`, `blog`, and `persian` (#9).
- `sourcemap.json` format v0 and its schema (#66).
- A guide to source maps, with Liquid and Hugo templates other themes can copy (`docs/source-maps.md`, #70).
- A Hugo module, `adapters/hugo/`, that writes `sourcemap.json` with lines, Markdown twins, and `data-source` on headings, with a starter `AGENTS.md` and content schemas: a Hugo site reaches level L2 (#233).
- A schema for every `_config.yml` key the theme reads (#71).
- Documented override slots: `head-custom.html`, `footer-custom.html`, and `custom.css`.
- The public API under semver and the deprecation policy (ADR 0012, #172).
- `slipway doctor`: checks a site's source and output against the agent-editable spec and prints the level it reaches (#181).
- Generator detection for `slipway doctor`: `detect()` names the generator (Jekyll, Hugo, Astro, Docusaurus, MkDocs, Eleventy) and its source and output folders from marker files (#182).
- `slipway doctor` right-to-left checks: `dir` matches `lang`, and titles, `h1` headings, and nav links that mix directions isolate one of them (#184).
- `slipway doctor` Jekyll and Slipway checks: missing starter files, deprecated keys, Liquid in content, missing translations, and missing UI strings, each with a fix (#183).
- A `slipway doctor` GitHub Action (`action/doctor`) that annotates pull requests and can write SARIF (#186).
- `slipway doctor --format json` and `--format sarif` for agents and GitHub code scanning; a finding on a built page names its Markdown file and line (#185).
- An RFC process for spec changes, with a template, a 14-day review window, and `spec/CHANGELOG.md` (#180).
- Spec 0.1 "agent-editable site" and the `content-schemas.json` index schema (#177).
- Conformance levels L0 to L3 for the agent-editable spec, with a machine-readable `tests.json` (#178).
- A release workflow, `CHANGELOG.md`, and `tools/release/prepare.mjs` (#174).
- Build-time warnings for renamed config keys and front-matter fields, naming the replacement; the old names keep working (#173).
- `slipway-mcp`, an MCP server for a site with two read-only tools, `list_layouts` and `read_config` (#78).
- Editor autocomplete for `_config.yml` and `_data/navigation.yml` through the YAML language server, with `starter-files/.vscode/settings.json` and `docs/editor.md` (#74).
- "Edit with your agent" on every `h2` and `h3` of doc and post pages: a button copies a prompt with the source file, the line (Actions mode), and the section's text. It appears only with JavaScript and sends nothing (#82).
- `AGENTS.md` for every new site (`starter-files/AGENTS.md`): where content lives, the schemas, how to add a page, a post, a menu item, and a translation, how to check an edit, and a Never list (#75).
- Agent Skill `skills/slipway-site` for creating and customizing a site, with a config reference generated from the schema (#76).
- Agent Skill `skills/slipway-content` for writing pages, posts, and translations that pass the front matter schemas and `slipway doctor`, with a front matter reference generated from the schemas (#77).
- JSON-LD structured data on every page, typed by layout: `WebSite` on `home`, `BlogPosting` on `post`, `TechArticle` on `doc`, `CollectionPage` on `archive` and `tags`, `WebPage` elsewhere (#23).
- Header variants chosen with `slipway.header` in `_config.yml`: `classic`, `centered`, and `minimal` (#212).
- Opt-in, privacy-friendly analytics (GoatCounter, Plausible, Umami) with one config key (`slipway.analytics`) (#210).
- Arabic: a font stack (`--sl-font-arabic`), Persian-style line height and no italics, built-in UI strings, and opt-in Arabic-Indic digits with `slipway.arabic.digits` (#222).
- Opt-in Hijri calendar for Arabic pages with `slipway.arabic.hijri` (#225).
- Hebrew: a font stack (`--sl-font-hebrew`) and built-in UI strings, so `lang: he` pages read right to left with Hebrew labels (#223).
- `slipway doctor` as a `doctor` tool in `slipway-mcp` and an Agent Skill, `skills/slipway-doctor`, so agents check their own edits (#189).

### Fixed

- Quotes in font stack overrides are kept (#134).

[Unreleased]: https://github.com/arminazimi/slipway/commits/main
- Guide: make any generator conform to the spec, level by level
