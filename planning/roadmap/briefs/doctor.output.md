## Goal
JSON and SARIF output with file and line, for agents and GitHub code scanning.

## Agent brief

**Context**
Agents parse JSON; GitHub code scanning reads SARIF 2.1.0. Every finding must carry the source file and line (from `sourcemap.json` when the finding is about built output).

**Steps**
1. Define the JSON report shape in `spec/agent-editable/report.schema.json`: `{ version, generator, level, findings: [{ id, severity, message, file, line, column?, fix? }] }`.
2. Add `--format json` and `--format sarif` to the doctor; SARIF maps `id` to `ruleId` and `severity` to `level`.
3. When a finding has only a built URL, resolve it to `file` and `line` through `sourcemap.json`.
4. Validate the SARIF in a test against the official 2.1.0 schema stored in `packages/doctor/test/` (copy the schema file, do not fetch it).

**Files**
- `packages/doctor/src/report.mjs`
- `spec/agent-editable/report.schema.json`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not change a check id once published; add new ids instead.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] JSON output validates against the report schema.
- [ ] SARIF output validates against the SARIF 2.1.0 schema.
- [ ] A finding on built output shows the Markdown file and line.
