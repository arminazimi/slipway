## Goal
Move two of the maintainer's own projects to Slipway and file every friction as an issue.

## Agent brief

**Context**
A maintainer task. Armin chooses two real sites; the goal is evidence and a bug list, not a showcase.

**Steps**
1. Pick two projects with different shapes (for example a docs site and a blog), and write the choice and reason in a comment on this issue.
2. Migrate each, keeping a log of every step that needed more than one command or a guess.
3. File one issue per friction with the label `source: dogfood`, linking to the log entry; fix the top three before 0.3.0.
4. Write a short post-mortem (10 lines) in this issue: time taken, what broke, what was missing from the docs.

**Files**
- Armin's repositories
- this issue's comments

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not change the Slipway API to fit a single site; file an issue first.

## Done when
- [ ] Both sites are live on Slipway.
- [ ] At least ten friction issues exist, or the log says why fewer were found.
- [ ] The three most painful problems are fixed or scheduled in a milestone.
