# Contributing to Slipway

Thanks for helping. Slipway is built from small, independent tasks, so you can contribute a useful piece in an hour.

## Find work

Every planned task is an issue generated from [ROADMAP.md](ROADMAP.md) and linked to its epic.

- **Lane** says who a task suits:
  - `lane: free-agent`: spec-complete. Good for newcomers and for free or lightweight coding agents.
  - `lane: strong-agent`: needs design judgment. Good for experienced contributors and strong coding agents.
  - `lane: maintainer`: needs accounts, credentials, or decisions. Maintainers only.
- **Size** says how big it is: `size: XS` (under an hour), `size: S` (a few hours), `size: M` (about a day).
- Pick a task whose dependencies (listed under **Depends on**) are closed. Tasks labeled `needs: seaworthy` also wait on a Seaworthy release.

## Claim it

Comment on the issue to claim it. If you go quiet for a week, someone else may pick it up; just comment again if you are still on it.

## Do it

1. Read [AGENTS.md](AGENTS.md).
2. Follow the issue's agent brief, if it has one. If not, comment with a short plan first.
3. Keep the PR to that one issue.
4. Add tests for what users or agents can observe.
5. Run `npm run check`.
6. Open the PR with `Closes #<issue>`.

## Proposing starters, blocks, and migrations

Open an issue that names who the starter or block is for, links two or three real sites it should be able to build, and lists what it needs from the core theme.

## Using agents

Agents are welcome contributors. The same rules apply: one issue per PR, `npm run check` passes, and a human or agent reviewer can follow what changed. Say in the PR which agent you used, if any.
