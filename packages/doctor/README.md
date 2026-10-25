# slipway doctor

Checks a static site against the [agent-editable site spec](../../spec/agent-editable/0.1.md) and prints the [conformance level](../../spec/agent-editable/levels.md) it reaches, L0 to L3. It works for any generator: it reads the source folder and, when given, the built output folder, and runs every test in [`spec/agent-editable/tests.json`](../../spec/agent-editable/tests.json). It needs Node 22 and no Ruby.

```bash
node packages/doctor/bin/slipway.mjs doctor <source-dir> [--build <output-dir>] [--format text|json] [--level L0|L1|L2|L3] [--network]
```

Once the package is published, `npx slipway doctor` runs the same command. Until then, run it from a clone of this repository after `npm ci`.

| Option | Meaning |
| --- | --- |
| `--build <dir>` | The built output folder. Tests on the output (the source map, headings, the skills index) fail without it, because the site has not shown it meets them. |
| `--format json` | Print the report as JSON instead of text. |
| `--level <L>` | Exit 0 when the site reaches this level. Without it, exit 0 only when every MUST test passes. |
| `--network` | Fetch `https` schemas named in `content-schemas.json`. Without it, that part of `ae.schemas.resolve` is not run. No other test uses the network. |

Exit codes: `0` the target level is reached, `1` findings, `2` a usage error or a missing folder.

## Output

Text output names the level, then each failed test with its findings as `path:line key: message (allowed: ...)`, then the tests not run. A failed MUST is an `error`; a failed SHOULD is a `warning` and never lowers the level.

The JSON report has `spec`, `version`, `level` (`"L0"` to `"L3"`, or `null`), `notRun`, `tests` (every test with its `status`: `pass`, `fail`, or `not-run`), and `findings`. Each finding has `test`, `severity`, `message`, and when known `in` (`source` or `output`), `file` (relative to that folder), `line`, `key`, and `allowed`. The finding format is a draft until `doctor.output` fixes it.

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
