## Goal
Under the article: when the page last changed, a link to edit its source on GitHub, the edit-with-your-agent prompt, and a was-this-helpful link.

## Files

**Create**
- `packages/theme/chrome/page-footer/index.ts`
- `packages/theme/chrome/page-footer/style.css`
- `packages/theme/chrome/page-footer/client.ts`
- `packages/theme/test/chrome-page-footer.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Edit links use the repository and the page's source path from the root (sites in `docs/` work).
2. The agent prompt names the source file and line; the copy button is the only script.

## Done when
- [ ] Screenshots in light and dark are in the pull request, compared with `docs/design/mockups/guide.html` once it is approved.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
