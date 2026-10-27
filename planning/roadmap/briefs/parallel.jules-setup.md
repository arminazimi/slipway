## Goal
Cloud agents (Jules, Codex, Copilot) start from a bare VM. One script installs what `npm run check` needs, so agents run the full check instead of skipping the Ruby and browser steps.

## Files
Only these files. Another agent may be working on any other file right now.

**Create**
- `tools/agents/setup.sh` (Node 22, the Ruby in `.ruby-version`, `bundle install`, `npm ci`, Playwright browsers; idempotent)
- `tools/agents/README.md` (how to paste it into Jules' environment setup and other agents')

**Edit**
- `.gitignore` (add `.jules/`)
- `CONTRIBUTING.md` (one line pointing at the script)

## Steps
1. Make every step skip when its tool is already installed.
2. Run it twice on a clean Ubuntu container; the second run changes nothing.

## Done when
- [ ] `bash tools/agents/setup.sh && SLIPWAY_REQUIRE_BUILD=1 npm run check` passes on a clean Ubuntu 24.04 container.
- [ ] `npm run check` passes.

## Working in parallel
This task may edit these shared files: `.gitignore` (add `.jules/`). Leave every other shared file alone.

- Do not edit `CHANGELOG.md`. If a site owner would notice the change, add `changelog.d/<this issue number>.md` with one line instead.
- Write temporary builds to the OS temp folder or under `.tmp/`, never to a new top-level folder.
- Keep schema properties and UI string keys in alphabetical order, and add yours at its sorted place.
- If the task needs a file not listed above, stop and explain why in the pull request instead of editing it.

## Run
```bash
npm ci
npm run check
```
