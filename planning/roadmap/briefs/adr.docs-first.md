## Goal
Record why Slipway changes direction: from an editorial Jekyll theme with many starters to a documentation theme on its own TypeScript engine, with Evergreen as the first site and the agent-editable standard as the next step.

## Files

**Create**
- `docs/adr/0021-docs-first.md`

**Edit**
- `docs/adr/README.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Use the format of the existing ADRs in `docs/adr/` (status, context, decision, consequences).
2. Context: the editorial type system reads as a blog; the only real site is Evergreen's docs; the old roadmap had more than 45 epics.
3. Decision: docs-first; the theme reaches an acceptable level and Evergreen moves before work on the standard; non-docs features are removed or frozen; Jekyll is removed in 0.3.0.
4. Consequences: what is removed (starters, blog layouts, marketing blocks), what is frozen (`adapters/`), and that `remote_theme` stops being the install path.
5. Mark ADRs this supersedes (editorial type system, Jekyll-specific ones) in the Consequences list; do not edit those files here.
6. Add the ADR to the index in `docs/adr/README.md`.

## Done when
- [ ] The ADR is merged with status Accepted and listed in the ADR index.
- [ ] It names every superseded ADR by number.
- [ ] `npm run check` passes.
