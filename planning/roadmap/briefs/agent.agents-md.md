## Goal
`AGENTS.md` inside every site created from the template: structure, schemas, commands, and the `slipway doctor` loop.

## Agent brief

**Context**
Slipway's own `AGENTS.md` is for contributors. This one ships in the template and tells an agent how to edit the user's site. It is also requirement `ae.agents-md.present` in the spec.

**Steps**
1. Write `starter-files/AGENTS.md` (under 120 lines): site layout (where posts, docs, data, and config live), the front-matter schemas and where they are, how to add a page, a post, a navigation item, and a translation, and the loop: edit, run `npx slipway doctor .`, fix findings by file and line, repeat.
2. Include a 'Never' list: do not edit `_site/`, do not add Liquid to content, do not change `translation_key` on one side only.
3. Add a test that every command and path mentioned in the file exists (parse code spans) and that the file is under the line limit.
4. Make `examples/bare` and `examples/minimal` include it.

**Files**
- `starter-files/AGENTS.md`
- `tools/theme/agents-md.test.mjs`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not name Seaworthy as a requirement; mention it only as an optional extra.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] The file is under 120 lines and every referenced path and command exists.
- [ ] An agent that reads only this file can add a post that passes `slipway doctor`.
- [ ] It is listed in `starter-files/README`.
