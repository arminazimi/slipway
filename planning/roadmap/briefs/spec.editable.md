## Goal
Spec 0.1 "agent-editable site": what a site publishes so an agent can edit it safely.

## Agent brief

**Context**
Read ADR 0011 first: the spec says what makes a site safe for an agent to edit; readability and health belong to Seaworthy. The five items are `AGENTS.md`, content schemas, `sourcemap.json`, the agent-skills index, and edit prompts.

**Steps**
1. Create `spec/agent-editable/0.1.md` with one section per item: what must exist, where, its format, and how to check it (a test id like `ae.agents-md.present`).
2. Write it so a non-Jekyll site can satisfy it: no Liquid, no Jekyll paths in the normative text; Jekyll appears only in examples.
3. Use RFC 2119 words (MUST, SHOULD) and number each requirement.
4. Add a short rationale per requirement, one sentence, explaining the failure it prevents.

**Files**
- `spec/agent-editable/0.1.md`
- `spec/README.md`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not invent tooling in the spec; the checker is `doctor.cli`.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] Every requirement has an id, a level hint (L0 to L3), and a way to check it.
- [ ] The normative text never mentions Jekyll or Liquid.
- [ ] A reader can tell what changes between Spec 0.1 and the Spec 1.0 goal.
