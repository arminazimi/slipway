## Goal
`npx create-slipway`: new site from a starter, interactive or flags-only for agents.

## Agent brief

**Context**
`npx create-slipway my-site` is the shortest path from nothing to a working site. Agents need it non-interactive with flags; people want prompts. It copies a starter, it does not generate code.

**Steps**
1. Create `packages/create-slipway/` with `bin/create-slipway.mjs` (Node 22, no runtime dependencies).
2. Flags: `<dir>`, `--title`, `--lang`, `--mode remote|gem|template`, `--yes`. Without a TTY or with `--yes`, never prompt; with a TTY, prompt only for missing values using `node:readline`.
3. Copy `starter-files/` and `examples/bare`, write `_config.yml` from the answers, and refuse a non-empty directory.
4. Print the next three commands (build, `slipway doctor`, push).
5. Test: run it in a temp folder with flags and check the files; build the result in gem mode when Ruby is present.

**Files**
- `packages/create-slipway/`
- `package.json` (workspaces)

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not publish to npm; that is a maintainer step.
- Do not fetch anything from the network.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `node packages/create-slipway/bin/create-slipway.mjs tmp --title T --lang fa --yes` creates a site that builds.
- [ ] It never prompts without a TTY.
- [ ] A non-empty target folder is refused with exit code 2.
