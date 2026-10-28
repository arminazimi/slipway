# slipway doctor

Checks a static site against the [agent-editable site spec](../../spec/agent-editable/0.1.md) and prints the [conformance level](../../spec/agent-editable/levels.md) it reaches, L0 to L3. It works for any generator: it reads the source folder and, when given, the built output folder, and runs every test in [`spec/agent-editable/tests.json`](../../spec/agent-editable/tests.json). It needs Node 22 and no Ruby.

```bash
node packages/doctor/bin/slipway.mjs doctor <source-dir> [--build <output-dir>] [--format text|json|sarif] [--level L0|L1|L2|L3] [--network] [--fix] [--dry-run]
```

Copy-paste snippet for your AGENTS.md: docs/snippets/agents-md.md

Once the package is published, `npx slipway doctor` runs the same command. Until then, run it from a clone of this repository after `npm ci`.

You can also run it in your CI. See [CI Recipes](../../docs/guides/ci.md) for GitLab CI, Netlify, Cloudflare Pages, Vercel, and pre-commit.

| Option | Meaning |
| --- | --- |
| `--build <dir>` | The built output folder. Tests on the output (the source map, headings, the skills index) fail without it, because the site has not shown it meets them. |
| `--format json` | Print the report as JSON instead of text. |
| `--format sarif` | Print a SARIF 2.1.0 log for GitHub code scanning. |
| `--level <L>` | Exit 0 when the site reaches this level. Without it, exit 0 only when every MUST test passes. |
| `--network` | Fetch `https` schemas named in `content-schemas.json`. Without it, that part of `ae.schemas.resolve` is not run. No other test uses the network. |
| `--fix` | Automatically fix safe cases (missing stubs, deprecated keys) and print a diff. |
| `--dry-run` | Print a diff of what `--fix` would do, without changing files. |

Exit codes: `0` the target level is reached, `1` findings, `2` a usage error or a missing folder.

Agents can run it without a shell: the [MCP server](../mcp/README.md) has a `doctor` tool that returns the JSON report, and the [`slipway-doctor` Agent Skill](../../skills/slipway-doctor/SKILL.md) says when to run it and how to fix what it finds.

## Output

Text output names the level, then each failed test with its findings as `path:line key: message (allowed: ...)`, then the tests not run. A failed MUST is an `error`; a failed SHOULD is a `warning` and never lowers the level.

The JSON report follows [`spec/agent-editable/report.schema.json`](../../spec/agent-editable/report.schema.json): `spec`, `version`, `generator` (what `detect()` names, or `unknown`), `level` (`"L0"` to `"L3"`, or `null`), `notRun`, `tests` (every test with its `status`: `pass`, `fail`, or `not-run`), and `findings`. Each finding has the test `id`, `severity`, `message`, and when known `in` (`source` or `output`), `file` (relative to that folder), `line`, `column`, `key`, `allowed`, and `fix`.

A finding on a built page is moved to its source: when `sourcemap.json` lists the page, `file` is the page's source file, `line` is the line of the section the finding is about, and `output.file` keeps the built file. A finding that already has a line in the built page and is not about a section keeps that line, which is more precise. Text output shows the same `path:line`.

SARIF output has one rule per test (`ruleId` is the test id, a MUST is an `error`, a SHOULD a `warning`) and one result per finding. Its paths are relative to the folder you run the doctor in, so run it from the repository root and upload the file with `github/codeql-action/upload-sarif`:

```bash
node packages/doctor/bin/slipway.mjs doctor . --build _site --format sarif > doctor.sarif
```

A finding with no file, such as a missing output folder, has no location in SARIF; GitHub code scanning does not show those, so read the text or JSON output too. The SARIF test uses a copy of the official schema in `test/sarif-schema-2.1.0.json`.

## Jekyll and Slipway checks

When `detect()` says Jekyll, or `_config.yml` names a Slipway `theme` or `remote_theme` (a site on the remote theme needs no Gemfile or `_layouts/`), doctor also runs the checks in `src/checks/jekyll.mjs`. They are not spec tests: a finding is a `warning` with a `fix`, it never changes the level or the exit code, and in the report the test has `level: null` and `scope: "jekyll"`.

| Check id | What it finds |
| --- | --- |
| `doctor.root-links` | Root-relative links in Markdown files that skip `baseurl`. |
| `jekyll.stubs` | A file from `starter-files/` (except its README) that the site has not copied. |
| `jekyll.deprecated` | A deprecated config key or front-matter field from `schema/deprecations.json` (ADR 0012), with its replacement. |
| `jekyll.liquid-in-content` | `{{` or `{%` in the body of a Markdown page, outside code spans and code blocks: content that only Jekyll can render. |
| `jekyll.translation-pair` | A `translation_key` with no page in one of the languages in `slipway.languages`. |
| `jekyll.ui-strings` | A UI string key a site adds in `_data/i18n/<lang>.yml` that another listed language has no text for. Keys the theme has built in fall back to English and are not reported. |

To add a new check, add a file in `src/checks/` (one per check) exporting its `id`, `level` or `warning`, and a `run(site)` function, then document it in `docs/checks/<id>.md` and add it to `tests.json`.

`schema/deprecations.json` is a copy too; `tools/theme/deprecations.mjs` uses the same finder (`slipway/deprecations`).

## Generator detection

`detect(dir)` from `slipway/detect` (`src/detect.mjs`) names a site's generator and its default source and output folders from marker files alone; it never runs a build.

| Generator | Marker | Source | Output |
| --- | --- | --- | --- |
| Jekyll | `_config.yml` with a `Gemfile` or `_layouts/` | `.` | `_site` |
| Hugo | `hugo.toml`, `hugo.yaml`, `hugo.json`, or `config.toml` with `baseURL` | `content` | `public` |
| Astro | `astro.config.*` | `src` | `dist` |
| Docusaurus | `docusaurus.config.*` | `docs` | `build` |
| MkDocs | `mkdocs.yml` | `docs` | `site` |
| Eleventy | `.eleventy.js` or `eleventy.config.*` | `.` | `_site` |

It returns `{ generator, sourceDir, outputDir, confidence, candidates }`. `confidence` is `high` for one marker and `low` when several generators match; then a generator's own config file wins over Jekyll's `_config.yml` and Hugo's `config.toml`. A folder with no marker returns `generator: "unknown"`, `confidence: "none"`, and `null` folders, and the doctor runs only the generator-neutral tests, as it does today.

## What it does not do yet

- `ae.schemas.config` is not run: which files a generator reads as configuration will come from generator detection, which the doctor does not use yet. For the same reason `ae.sourcemap.coverage` also lists drafts and partials.
- Front matter in TOML is not parsed; files that use it are reported as not checked.
- The two review tests, `ae.edit-prompt.content` and `ae.edit-prompt.no-send`, are left to a person.

`spec/tests.json` and `schema/` are copies of the repository's files, so the package works on its own; a test fails when they differ.
