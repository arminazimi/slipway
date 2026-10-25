## Goal
Public benchmark: agents do 20 edit tasks on Slipway and on three popular themes; success rate, tokens, and time; rerunnable in CI.

## Agent brief

**Context**
The point is evidence that the spec helps agents. Define the tasks and the scoring first; run them second. Candidate comparison themes: Minimal Mistakes, Just the Docs, Chirpy.

**Steps**
1. Write `benchmark/tasks.md`: 20 tasks (add a post with tags, fix a broken link, translate a page, add a navigation item, change the accent color, add an image with alt text, and so on), each with a start repo state and an automatic pass/fail check (a script, not a judgment).
2. Write `benchmark/run.mjs`: for each theme and task, copy the fixture, run the agent command given by `--agent`, run the check, record pass/fail, tokens (from the agent's log), and wall time into `benchmark/results/<date>.json`.
3. Pin the three comparison themes by commit and the agent by model name in the results file.
4. Add a nightly-or-manual GitHub workflow `benchmark.yml` (manual dispatch only at first) that runs the benchmark with a repository secret for the API key.

**Files**
- `benchmark/`
- `.github/workflows/benchmark.yml`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not add API keys to the repository.
- Do not publish numbers from fewer than 3 runs per task.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] All 20 tasks have an automatic check and pass on a hand-made reference solution.
- [ ] `benchmark/run.mjs --dry-run` runs the checks against reference solutions in CI without any agent.
- [ ] The results file schema is documented.
