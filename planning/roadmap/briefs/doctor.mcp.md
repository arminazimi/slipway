## Goal
`slipway doctor` as an MCP tool and an Agent Skill, so agents run it themselves.

## Agent brief

**Context**
Agents should run the doctor themselves, not wait for CI. `agent.mcp-server` gives the server; this adds a `doctor` tool to it and an Agent Skill that tells agents when to call it.

**Steps**
1. Add a `doctor` tool to `packages/mcp/`: input `{ path, build?, level? }`, output the JSON report from `doctor.output` as structured content.
2. Import the doctor as a function (no child process) and refuse paths outside the site root.
3. Write `skills/slipway-doctor/SKILL.md`: when to run it (after every content edit), how to read a finding, and the fix loop.
4. Test over stdio: `tools/list` includes `doctor`, and a call on a failing fixture returns its findings.

**Files**
- `packages/mcp/src/tools/doctor.mjs` and test
- `skills/slipway-doctor/SKILL.md`

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
- [ ] The `doctor` tool returns the same findings as the CLI for the same fixture.
- [ ] The skill is under 80 lines and names the tool and the CLI.
- [ ] Paths outside the site are refused.
