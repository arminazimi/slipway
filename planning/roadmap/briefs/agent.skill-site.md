## Goal
Agent Skill: create a Slipway site and customize it.

## Agent brief

**Context**
An Agent Skill is a folder with a `SKILL.md` that agents (Claude Code, Codex, and others) load when the task matches its description. This one covers creating a Slipway site and customizing it through config, not CSS.

**Steps**
1. Write `skills/slipway-site/SKILL.md` with frontmatter `name` and a one-line `description` that names when to use it.
2. Body: create the site (`npx create-slipway` once it exists, otherwise `remote_theme` and `starter-files/`), set title, languages, tokens, navigation, and the override slots; finish by running `slipway doctor`.
3. Add `skills/slipway-site/reference/config.md` generated from `schema/slipway-config.schema.json` (keys, types, defaults), and a check that it is in sync.
4. Test: every command and path in the skill exists, and the frontmatter is valid.

**Files**
- `skills/slipway-site/`
- `tools/skills/` (generator and test)

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not describe a CLI flag or key that does not exist yet; write what exists today.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `SKILL.md` is under 150 lines with a valid frontmatter.
- [ ] The config reference is generated and checked in `npm run check`.
- [ ] Every referenced path and command exists.
