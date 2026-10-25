## Goal
Five early users (Persian and Arabic developers, docs authors), each with written feedback.

## Agent brief

**Context**
A maintainer task. The docs quickstart must exist first. Feedback is only useful if collected the same way each time.

**Steps**
1. Prepare a 10-question feedback form (time to first page, what failed, RTL quality, whether they would recommend it, free text) and a 15-minute call script.
2. Invite ten people so five accept: two Persian-language developers, one Arabic, two docs authors, with at least one non-Jekyll user for `slipway doctor`.
3. Watch each person do the quickstart (call or screen recording) without helping unless they are stuck for 5 minutes; note where they stalled.
4. Publish the anonymised results in `docs/feedback/2026-11.md` and file an issue per stall.

**Files**
- `docs/feedback/`
- this issue's comments

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not publish names or quotes without written permission.

## Done when
- [ ] Five completed sessions with the same form.
- [ ] A results page exists in the repository.
- [ ] Every stall is an issue or a note on why it is not one.
