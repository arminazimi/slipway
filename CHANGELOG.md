# Changelog

All notable changes to Slipway are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/) for the public API in [ADR 0012](docs/adr/0012-public-api.md). Pin a release with `remote_theme: arminazimi/slipway@v<version>`.

Pull requests add a fragment in [`changelog.d/`](changelog.d/README.md), not a line here. `node tools/release/prepare.mjs <version>` turns `Unreleased` and the fragments into a release ([CONTRIBUTING.md](CONTRIBUTING.md#releasing)).

## [Unreleased]

## [0.2.0] - 2026-10-30

This is the first release Evergreen pins: `remote_theme: arminazimi/slipway@v0.2.0`. It adds a block library, eleven starters, the `slipway` command line and its agent tools, and 25 more interface languages. Nothing in it breaks 0.1.0 sites.

### Highlights

- **A site with only `remote_theme` and a title builds.** New sites copy search and 404 stubs from `starter-files/`, and `jekyll-feed` and `jekyll-sitemap` generate the feed and sitemap without copied pages.
- **Starters.** Academic, versioned documentation, portfolio, project homepage, bilingual (English and Persian), developer tool, team handbook, resume, digital garden, nonprofit, and links (#86, #87, #89, #90, #91, #515, #522).
- **Content blocks.** Hero, code group, annotations, diff, chart, people, testimonial, pricing, logos, audio, citation, download, file tree, API endpoint, gallery, badge, and numbered steps, with a block author guide and a test that every block has a docs page, a test, and a stylesheet (#851, #859).
- **Agent tools.** New `slipway` commands, MCP tools, and Agent Skills let an agent create, edit, translate, deploy, and check a site.
- **Evergreen-shaped sites.** Pages without front matter, generated sections with hundreds of pages, and a site's own `sitemap.xml`, `llms.txt`, and `robots.txt` all work (#406 to #412).

### Added

#### Theme and content

- Per-page social image: `image` in front matter wins over the shared `assets/images/social.png`, the Twitter card follows the picture, and in Actions mode a site that adds `_plugins/slipway_og.rb` gets a default picture generated from each page's title (printable-ASCII titles).
- Posts opt into a table of contents and a reading-progress bar with `toc: true`; the bar is pure CSS and works without JavaScript.
- Posts accept an `updated` date shown as "edited on" and reported by the feed, the sitemap, and the structured data. Future-dated posts show as Scheduled in preview, and drafts live in `_drafts/`.
- Optional comments through giscus, opt-in with `slipway.comments` (#209).
- Doc pages show when they last changed: `last_modified_at` in front matter, or in Actions mode the file's last git commit through `_plugins/slipway_last_modified.rb`.
- `canonical_url` in front matter controls the `<link rel="canonical">` and JSON-LD URLs.
- A `changelog` layout with stable version anchors, a version list, and an Atom release feed.
- A schema table include that renders a JSON Schema from `_data` as a property table.
- ADR metadata and an index grouped by decision status, with translated labels and supersession links.
- A `snippet` include that embeds a region of a repository file by marker; a check fails when the region is gone (#729).
- Static redirect pages for moved URLs through the `redirects` config.
- Pages can cap their search text with `slipway.search.text` and index only the description with `search: excerpt` (#651).
- A themed 404 page on the Slipway site, a public roadmap at `/roadmap/` generated from `ROADMAP.md` (#706), and a Customization Guide.
- Guides and recipes: how each page picks its social card, deploying to GitLab Pages, redirects with `jekyll-redirect-from`, `rel="me"` links and Mastodon verification, and verifying a release's CycloneDX SBOM and gem provenance attestation.
- The spec site lists every adapter and explains how to add one by pull request (#240).
- `examples/product-docs`, a documentation site shaped like Evergreen's, built and checked in CI (#412).

#### Command line, MCP, and Skills

- `slipway nav` edits navigation items while preserving comments, `slipway translate` creates a translated copy of a page, and `slipway info` prints the site's mode, theme pin, versions, and spec level.
- `slipway --help` lists every command in `packages/doctor/src/commands/`; adding a command is adding a file.
- `slipway doctor --explain [<id>]` explains a check id and suggests the right one for a typo. The check pages ship in the package, so it works from a published install (#600).
- New MCP tools: `list_pages`, `read_section`, and `move_page`, which keeps the old URL with `redirect_from` and updates navigation and links (#478).
- New Agent Skills: `slipway-blocks`, `slipway-translate`, `slipway-deploy`, `slipway-design`, and `slipway-release-notes` (#771, #774).
- New sites made with the CLI carry offline schemas and the source-map and twin plugins, with an explicit L2 doctor loop.
- `slipway doctor` prints a one-line hint pointing at the Skills when a site publishes none (text output only).
- The doctor Action writes a job summary with the level and a findings table, and an optional shields.io badge JSON (#799).

#### Doctor checks

- `doctor.agents-commands` warns when a site's `AGENTS.md` names an npm script or a file the site does not have.
- `doctor.nav-targets` finds broken links in `_data/navigation.yml`.
- `doctor.lang-mismatch` warns when a page's text script cannot be written in its `lang`.
- Docs pages without a description, headings that skip a level, and pages nothing links to now produce warnings (#745).

#### Languages

- New built-in interface languages: Central Kurdish (`ckb`), Pashto, Uyghur (`ug`), Dhivehi (Thaana, right to left; #460), Sindhi (`sd`), Korean, Hindi, Bengali, Indonesian, Malay, Vietnamese, Thai, Polish, Ukrainian, Czech, Swedish, Danish, Norwegian Bokmål, Finnish, Greek, Romanian, Hungarian, Azerbaijani, Swahili, and Tamil (#816 to #838).
- Dhivehi, Hebrew, Sindhi, and Uyghur sites show every theme string, and the docs list each language's completeness (#816).

#### Tools

- A page-weight tool measures transferred bytes and enforces budgets per page type.
- An opt-in lifecycle workflow for sites in `starter-files/optional/`.

### Changed

- Pages whose content starts with an h1 no longer get a second one from the doc and page layouts (#406).
- Docs navigation accepts a `match` path prefix for generated sections, marks the section in the sidebar and breadcrumbs, and keeps per-page previous and next links hidden (#408).
- Search keeps only the title, URL, headings, and a 300-character excerpt per entry, loads its index when the search field is first used, and skips pages with `search: false` (#409).
- Edit prompts prefix section source paths with `slipway.source_dir` or GitHub Pages' source folder; source-map paths stay relative to the site (#410).
- Doctor never asks a site for its own `sitemap.xml`, `llms.txt`, `llms-full.txt`, or `robots.txt`; `docs/site-files.md` lists what Slipway generates and what a site may own (#407).
- Every GitHub Action the repository runs is pinned to a commit SHA, with a test that fails on an unpinned `uses:` (#528).

## [0.1.0] - 2026-10-27

- Added honest comparison page (`/compare/`) evaluating Slipway against Minimal Mistakes, Just the Docs, Chirpy, and hosted platforms.
- Built-in UI strings for ten more languages: es, fr, pt, de, it, ru, tr, nl, ja, zh (#224).
- `@slipway/tokens` npm package exporting the theme's design tokens and core CSS.
- Blog starter in `starters/blog/`.
- Published the agent-editable spec as a versioned site at `/spec/0.1/` with stable JSON Schema URLs (#179).
- Generated configuration reference from the JSON schema for the documentation site (#252).
- Added `translation-status` layout to show which pages exist in which language.
- Added cross-browser testing with Playwright.
- Added security headers documentation (`docs/security-headers.md`) and CSP validation tests to ensure the theme works securely out-of-the-box.

### Added
- `UPGRADING.md` to document breaking changes across releases (#176).
- Breadcrumbs above the title of doc and page layouts for nested pages, with a `BreadcrumbList` JSON-LD block. Translated labels for Persian, Arabic, and Hebrew.
- "Copy page as Markdown" button on pages that have a Markdown twin (#24).
- `slipway.fonts: system` skips downloading web fonts and uses the reader's system typography (system-ui, and system Arabic). Persian text is shaped correctly and remains readable. (#216)
- Social links from `_data/social.yml` shown in the footer with an inline SVG icon set (#208).

- Motion tokens (`--sl-motion-fast`) and hover transitions on interactive elements, respecting `prefers-reduced-motion` (#218).
- Logo and favicon configuration (`slipway.logo.light`, `slipway.logo.dark`, `favicon_svg`, `touch_icon`) in `_config.yml` (#215).
- Search: normalization covers more Arabic combining marks, ZWJ, and `ئ` and `ڪ` variants, so a Persian query typed with Arabic letters always finds the Persian page (#229).

- Eleventy adapter: a plugin that writes `sourcemap.json`, Markdown twins, and `data-source` on headings, with starter `AGENTS.md` and content schemas (#236).
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
- The release workflow now pushes `slipway-theme` to RubyGems after the GitHub release, through trusted publishing (#175).
- Changelog fragments in `changelog.d/` and a self-discovering `npm run check`, so parallel pull requests no longer conflict on `CHANGELOG.md`, `package.json`, or `ci.yml` (#389).

[Unreleased]: https://github.com/arminazimi/slipway/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/arminazimi/slipway/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/arminazimi/slipway/releases/tag/v0.1.0
- Guide: make any generator conform to the spec, level by level
- **doctor:** Add `--fix` and `--dry-run` to fix safe cases automatically (missing stubs, deprecated keys).
