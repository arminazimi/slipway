# Share this page

Share links for the page: X and LinkedIn with the page title and address, and a copy-link
button. The X and LinkedIn links are plain anchors, so they work without JavaScript. The
copy button starts `hidden` and the island reveals it once the browser has a clipboard.

## Files

- `index.ts`: the Preact component. Its default export is the chrome part. It renders nothing
  for a page that is not a doc page (`page.kind !== "doc"`). The address is absolute when the
  site sets `url` in `mizzen.yml`, and the page URL otherwise.
- `style.css`: the label, the links, and the copy button, from design tokens only.
- `client.ts`: the island. It reveals the copy button when `navigator.clipboard` exists and
  writes the button's address to the clipboard on click, announcing the result in the
  `role="status"` region.
- `../../test/chrome-share.test.ts`: the unit's tests.

## Strings

The labels come from the theme's string table: `share`, `share_on_x`, `share_on_linkedin`,
`share_copy_link`, `share_copied`, and `share_copy_failed` (English, Persian, and Arabic).

## Limits

The engine does not wire chrome islands into built pages yet (`packages/engine/src/pipeline/build.ts`
says so), so a built page currently shows the X and LinkedIn links and keeps the copy button
hidden. The links are the no-JavaScript fallback and work today; the button starts working
when the engine loads chrome islands.
