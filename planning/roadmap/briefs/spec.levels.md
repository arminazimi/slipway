## Goal
Conformance levels L0 to L3, with a machine-readable list of tests.

## Agent brief

**Context**
Levels let a site say how far it goes. Suggested shape: L0 has `AGENTS.md` and a page-to-file map; L1 adds schemas for config and front matter; L2 adds section-to-line maps and edit prompts; L3 adds the agent-skills index and a clean `slipway doctor` in CI. Adjust if `spec.editable` suggests otherwise.

**Steps**
1. Write `spec/agent-editable/levels.md` naming what each level requires.
2. Write `spec/agent-editable/tests.json`: an array of `{ id, level, description, how }` for every requirement from `spec.editable`, with a JSON Schema `schema/conformance-tests.schema.json`.
3. Add a test that every requirement id in the spec appears in `tests.json` and the other way round.
4. Document how a site reports its level (`slipway doctor` output field `level`).

**Files**
- `spec/agent-editable/levels.md`, `tests.json`
- `schema/conformance-tests.schema.json`
- a test in `tools/spec/`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not add a level beyond L3.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `tests.json` validates against its schema and matches the spec's ids exactly.
- [ ] Each level is a strict superset of the one below.
- [ ] The doctor can load `tests.json` without hard-coded ids.
