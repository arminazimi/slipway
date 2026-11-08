## Goal
Block actions and the page agent menu work by keyboard and screen reader and stay inside the JavaScript budget.

## Files

**Create**
- `tools/agent-ui/run.mjs`
- `tools/agent-ui/run.test.mjs`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Drive both with the keyboard on `fixtures/docs-site` and check focus order and names.
2. Add their scripts to the page budget check.

## Done when
- [ ] The gate fails when either control is unreachable by keyboard, and skips with a notice without Playwright.
- [ ] `npm run check` passes.
