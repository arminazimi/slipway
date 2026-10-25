# slipway doctor

Checks a static site against the [agent-editable site spec](../../spec/agent-editable/0.1.md) and prints the [conformance level](../../spec/agent-editable/levels.md) it reaches, L0 to L3. It works for any generator: it reads the source folder and, when given, the built output folder, and runs every test in [`spec/agent-editable/tests.json`](../../spec/agent-editable/tests.json). It needs Node 22 and no Ruby.

```bash
node packages/doctor/bin/slipway.mjs doctor <source-dir> [--build <output-dir>] [--format text|json|sarif] [--level L0|L1|L2|L3] [--network]
```

Once the package is published, `npx slipway doctor` runs the same command. Until then, run it from a clone of this repository after `npm ci`.

| Option | Meaning |
| --- | --- |
| `--build <dir>` | The built output folder. Tests on the output (the source map, headings, the skills index) fail without it, because the site has not shown it meets them. |
| `--format json` | Print the report as JSON instead of text. |
| `--format sarif` | Print a SARIF 2.1.0 log for GitHub code scanning. |
| `--level <L>` | Exit 0 when the site reaches this level. Without it, exit 0 only when every MUST test passes. |
| `--network` | Fetch `https` schemas named in `content-schemas.json`. Without it, that part of `ae.schemas.resolve` is not run. No other test uses the network. |

Exit codes: `0` the target level is reached, `1` findings, `2` a usage error or a missing folder.

## Output

Text output names the level, then each failed test with its findings as `path:line key: message (allowed: ...)`, then the tests not run. A failed MUST is an `error`; a failed SHOULD is a `warning` and never lowers the level.

The JSON report follows [`spec/agent-editable/report.schema.json`](../../spec/agent-editable/report.schema.json): `spec`, `version`, `generator` (`unknown` until generator detection lands), `level` (`"L0"` to `"L3"`, or `null`), `notRun`, `tests` (every test with its `status`: `pass`, `fail`, or `not-run`), and `findings`. Each finding has the test `id`, `severity`, `message`, and when known `in` (`source` or `output`), `file` (relative to that folder), `line`, `column`, `key`, `allowed`, and `fix`.

A finding on a built page is moved to its source: when `sourcemap.json` lists the page, `file` is the page's source file, `line` is the line of the section the finding is about, and `output.file` keeps the built file. Text output shows the same `path:line`.

SARIF output has one rule per test (`ruleId` is the test id, a MUST is an `error`, a SHOULD a `warning`) and one result per finding. Its paths are relative to the folder you run the doctor in, so run it from the repository root and upload the file with `github/codeql-action/upload-sarif`:

```bash
node packages/doctor/bin/slipway.mjs doctor . --build _site --format sarif > doctor.sarif
```

A finding with no file, such as a missing output folder, has no location in SARIF; GitHub code scanning does not show those, so read the text or JSON output too. The SARIF test uses a copy of the official schema in `test/sarif-schema-2.1.0.json`.

## What it does not do yet

- `ae.schemas.config` is not run: which files a generator reads as configuration comes from generator detection (`doctor.detect`). For the same reason `ae.sourcemap.coverage` also lists drafts and partials.
- Front matter in TOML is not parsed; files that use it are reported as not checked.
- The two review tests, `ae.edit-prompt.content` and `ae.edit-prompt.no-send`, are left to a person.

`spec/tests.json` and `schema/` are copies of the repository's files, so the package works on its own; a test fails when they differ.
