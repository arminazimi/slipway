## Goal
Docs: how source maps work, what each mode supports, and how other themes can emit them.

## Agent brief

**Context**
Source maps are Slipway's signature and the core of the spec. Users need to know what each mode gives them, and other themes need enough to emit the same file.

**Steps**
1. Write `docs/source-maps.md`: what `sourcemap.json` is, a short annotated example, and a table of modes (classic Pages: pages only; committed file: lines; Actions mode: lines and ids).
2. Add a section 'Emit it from another theme' with the minimal Liquid loop and a Hugo template sketch, both validated against the schema in a test.
3. Link it from `README.md`, `docs/modes.md`, and the spec.
4. Keep the example JSON in the doc in sync with the schema with a test that extracts and validates it.

**Files**
- `docs/source-maps.md`
- `tools/theme/docs.test.mjs`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] The page explains all three modes in one table.
- [ ] The example JSON validates against the schema in a test.
- [ ] It is linked from the README and the spec.
