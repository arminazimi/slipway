## Goal
Turn mdast into hast and HTML, and stamp each block element with its source file and line, the base of source maps and edit prompts.

## Files

**Create**
- `packages/engine/src/markdown/to-html.ts`
- `packages/engine/test/md-html.test.ts`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. remark-rehype with raw HTML allowed.
2. `data-src="path:line"` on headings, paragraphs, lists, tables, code blocks, blockquotes, and directive components.
3. Collect `headings` (depth, text, id) for the page.

## Done when
- [ ] Every block element in a sample page carries the right line (tested).
- [ ] `npm run check` passes.
