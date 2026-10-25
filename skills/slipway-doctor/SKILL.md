---
name: slipway-doctor
description: Check a static site with slipway doctor after you edit it, read the findings, and fix them until the site reaches its conformance level. Use for any Slipway site or any site that follows the agent-editable site spec.
---

# Check a site with slipway doctor

`slipway doctor` checks a site's source folder and, when given, its built output against the [agent-editable site spec](https://github.com/arminazimi/slipway/blob/main/spec/agent-editable/0.1.md). It reports the [conformance level](https://github.com/arminazimi/slipway/blob/main/spec/agent-editable/levels.md) the site reaches, L0 to L3, and every finding with its file and line. It works for any generator and never changes a file.

Run it after every edit, before you say the edit is done.

## 1. Run it

Use the `doctor` tool when the Slipway MCP server is registered for the site (`packages/mcp/README.md` in the theme repository says how). It takes two optional inputs:

| Input | Meaning |
| --- | --- |
| `build` | The built output folder, relative to the site, such as `_site`. Without it, the tests on the output fail. |
| `level` | The level the site must reach, `L0` to `L3`. Without it, `ok` is true when every MUST test passes. |

Otherwise run the command line from a clone of the theme repository, after `npm ci`:

```sh
node packages/doctor/bin/slipway.mjs doctor <site> --build <site>/_site --format json
```

Add `--level L2` (or the level the site's `AGENTS.md` names) to fail below that level. In CI, `--format sarif` writes the findings for GitHub code scanning. Exit code `0` means the target is reached, `1` means findings, and `2` a usage error or a missing folder.

Build the site first when you pass `build`, so the doctor checks the output of your edit and not an old one. Leave `--network` off unless the owner asks: it fetches remote schemas, and no other test needs it.

## 2. Read the report

The tool returns the JSON report; the command prints it with `--format json`. Read these fields:

- `ok`: the tool's answer to "is the site done?". The command's exit code says the same.
- `level`: the highest level reached, or `null` when an L0 MUST test fails.
- `findings`: what to fix. Each has the test `id`, `severity`, `message`, and when known `in` (`source` or `output`), `file` (relative to that folder), `line`, `column`, `key`, `allowed`, and `fix`. A finding on a built page already names its source file and line when the site has a source map; `output.file` keeps the built file.
- `notRun`: tests the doctor did not run. Two are decided by a person; tell the owner, do not mark them as passed.

An `error` is a failed MUST: it keeps the site below the level. A `warning` is a failed SHOULD, or a generator check such as `jekyll.stubs`: fix it when the fix is clear, but it never lowers the level.

## 3. Fix and run it again

1. Fix findings in the source. A finding with `in: output` points at a built file the source map does not cover; change the source that produces it, never the built file.
2. Use `fix` and `allowed` when a finding has them: they name the value the site needs.
3. Fix errors first, lowest level first: an L0 error hides what L1 and above would report.
4. Run the doctor again, with the same inputs. Stop when `ok` is true and no new finding appeared.

If a finding stays after two attempts, stop and report it to the owner with its `id`, file, line, and message.

## Never

- Never lower `level`, drop `build`, or remove a file the doctor reads to get `ok`. That hides findings instead of fixing them.
- Never edit `spec/agent-editable/tests.json`, the schemas, or the doctor itself to make a site pass.
- Never fix a finding by deleting the content it is about, unless the owner asked for that.
