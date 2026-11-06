## Goal
A copy button that copies the code (without diff markers or prompts) and confirms with a check icon and a live region message.

## Files

**Create**
- `packages/theme/components/code/client.ts`
- `packages/theme/test/component-code-copy.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Hidden without JavaScript.
2. Clipboard API with a fallback message on failure.

## Done when
- [ ] `npm run check` passes.
