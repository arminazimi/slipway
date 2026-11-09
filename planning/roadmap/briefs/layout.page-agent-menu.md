## Goal
A page menu to copy or view the page's Markdown and open it in Claude, ChatGPT, or Cursor (Lateen differentiator 2).

## Files

**Create**
- `packages/theme/chrome/page-agent-menu/index.ts`
- `packages/theme/chrome/page-agent-menu/style.css`
- `packages/theme/chrome/page-agent-menu/client.ts`
- `packages/theme/test/chrome-page-agent-menu.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. "View Markdown" is a plain link to the twin, so it works without JavaScript.
2. Copy and the open-in links are an island; nothing is sent anywhere until the reader chooses.
3. The list of providers comes from theme options.

## Done when
- [ ] Screenshots in light, dark, and right-to-left are in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
