## Goal
RFC process for spec changes: template, review window, changelog.

## Agent brief

**Context**
Other generators and themes will adopt the spec only if changes are predictable. Keep the process light: a markdown template, a fixed review window, and a changelog.

**Steps**
1. Add `spec/rfcs/0000-template.md` with Summary, Motivation, Change (normative text), Compatibility (which level, breaking or not), and Alternatives.
2. Write `spec/PROCESS.md`: open a pull request with the RFC; review window of 14 days; the maintainer accepts or declines; accepted RFCs change the spec and add a `spec/CHANGELOG.md` entry in the same pull request.
3. Add `spec/CHANGELOG.md` with the `0.1` entry.
4. Add a pull request template section for spec changes in `.github/pull_request_template.md`.

**Files**
- `spec/rfcs/`
- `spec/PROCESS.md`
- `spec/CHANGELOG.md`
- `.github/pull_request_template.md`

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
- [ ] The template, process, and changelog exist and are linked from the spec's index.
- [ ] The process fits on one screen.
- [ ] `npm run check` passes.
