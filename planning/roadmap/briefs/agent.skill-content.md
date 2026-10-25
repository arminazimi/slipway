## Goal
Agent Skill: write pages and posts that pass the schemas and `slipway doctor`.

## Agent brief

**Context**
The second skill covers daily work: writing a page or a post that passes the schemas and `slipway doctor`, in any language the site has, including right-to-left ones.

**Steps**
1. Write `skills/slipway-content/SKILL.md`: pick the layout, fill front matter from the schema, write the body without Liquid, add a translation with `translation_key`, and run the doctor.
2. Add `reference/front-matter.md` generated from the front-matter schemas, with the same sync check as `agent.skill-site`.
3. Add three short examples: a doc page, a post with tags, and a Persian translation of the post.
4. Test that each example validates against the front-matter schema.

**Files**
- `skills/slipway-content/`
- `tools/skills/`

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
- [ ] The three examples pass schema validation in a test.
- [ ] `SKILL.md` is under 150 lines.
- [ ] The generated reference is in sync in `npm run check`.
