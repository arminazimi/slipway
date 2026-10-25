## Goal
JSON Schema for the front matter of each layout and collection.

## Agent brief

**Context**
Agents write pages. The schema tells them which fields a `post`, `doc`, `page`, and `home` accept. ADR 0003 defines the content model; follow it.

**Steps**
1. Create `schema/front-matter/<layout>.schema.json` for `page`, `doc`, `post`, `home`, `archive`, with required fields, types, and enums (for example `lang`, `dir`, `translation_key`, `date`, `tags`).
2. Write `schema/front-matter/README.md` listing which layout and which collection uses which schema.
3. Add `tools/theme/front-matter.mjs` that reads a Markdown file, parses the front matter with `yaml`, picks the schema from `layout` or the collection folder, and returns errors with file, key, and allowed values.
4. Test against every Markdown file in `examples/` and against a set of invalid samples.

**Files**
- `schema/front-matter/`
- `tools/theme/front-matter.mjs` and test

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not make a field required that an existing example omits.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] Every Markdown file in the examples validates.
- [ ] An invalid sample reports file, key, and allowed values.
- [ ] The schemas are generated from or checked against ADR 0003.
