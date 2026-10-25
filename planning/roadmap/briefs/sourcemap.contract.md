## Goal
Define the `sourcemap.json` format (v0) with a JSON Schema, close to Seaworthy's `spec/source-map/v0` draft, and emit it.

## Agent brief

**Context**
ADR 0007 decided the three levels and left the field names as placeholders. Slipway owns this file (ADR 0011); Seaworthy will read it after 1.0, so stay close to its draft at github.com/arminazimi/seaworthy (`spec/source-map/v0`, Seaworthy issue #381). Read both before you start.

**Steps**
1. Write `spec/sourcemap/v0.md`: the file location (`/sourcemap.json`), a `version` field, one entry per page (`url`, `source`), optional `sections` (`id`, `level`, `line`, `text` in document order, as in ADR 0007) and `links` (`href`, `line`).
2. Write `schema/sourcemap.schema.json` (JSON Schema 2020-12) and a test with three valid and five invalid samples (missing `source`, line 0, wrong type, unknown version, duplicate url).
3. Record every difference from Seaworthy's draft in a table in the spec and open one issue per difference in Seaworthy's repo only if the maintainer agrees (do not file it yourself).
4. Update ADR 0007's Decision to name the final fields.

**Files**
- `spec/sourcemap/v0.md`
- `schema/sourcemap.schema.json`
- `tools/theme/sourcemap.test.mjs`
- `docs/adr/0007-source-maps.md`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not import Seaworthy code; use only its published spec.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] The schema validates the valid samples and rejects the invalid ones in a test.
- [ ] The spec lists every field with type, required or optional, and an example.
- [ ] ADR 0007 and the spec agree on field names.
