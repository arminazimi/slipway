## Goal
Right-to-left checks: `lang` and `dir` agree, mixed-direction titles are isolated.

## Agent brief

**Context**
Right-to-left is first class. Two mistakes are common and machine-checkable: a page whose `dir` does not match its `lang`, and a title that mixes Persian and Latin text without isolation, which renders with punctuation in the wrong place.

**Steps**
1. Add `packages/doctor/src/checks/rtl.mjs` with ids `rtl.dir-matches-lang` and `rtl.bidi-isolated`, generator-neutral (they read the built HTML).
2. `rtl.dir-matches-lang`: `<html lang>` in `fa`, `ar`, `he`, `ur` needs `dir=rtl`, and any other language must not have it.
3. `rtl.bidi-isolated`: in `<title>`, `h1`, and nav links, text with both strong-RTL and strong-LTR runs must be inside `<bdi>` or `dir=auto`, or use FSI/PDI marks.
4. Map findings to source files through `sourcemap.json` when present.
5. Fixtures: the Persian example passes; one mixed title without isolation fails.

**Files**
- `packages/doctor/src/checks/rtl.mjs` and test
- `packages/doctor/test/fixtures/rtl-*`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not parse HTML with regular expressions for nesting; use a small parser already in the lockfile, or add one with no dependencies.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] `examples/persian` has no RTL findings.
- [ ] The failing fixture gives one finding per mixed title, with file and line.
- [ ] Both checks are in `tests.json` with their level.
