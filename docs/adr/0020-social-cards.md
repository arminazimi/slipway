# 0020. Social cards: one 1200 × 630 template, filled per page and rasterized when a renderer is available

**Status:** Accepted (2026-10-30). Amends [ADR 0015](0015-og-images.md) rules 4 and 5: where a renderer is available, the designed card replaces the interim bitmap card, which stays as the fallback.

## Context

[ADR 0015](0015-og-images.md) gave each page its own picture: an `image` key that wins, `_plugins/slipway_og.rb` drawing the title and site name into a 1200 × 630 PNG with `zlib` and a 5 × 7 bitmap font, and the shared `assets/images/social.png` as the last fallback. The plugin is deliberately pure Ruby: an Actions build needs no image library, no font, and no network.

That card is a floor. It carries no mark, no section, and no URL; its bitmap font cannot shape Persian, Arabic, or Hebrew; and it cannot follow the brand's type. The docs platform epic (#662) asks for a designed card instead: one template, a section label, and a renderer that can set any script.

The constraints are unchanged: there is no server; classic Pages runs no plugins and Liquid cannot write files; crawlers take raster images, not SVG; colors and the mark have one source in `brand/tokens.json` and `tools/brand/`; and a build must still succeed on a machine with no renderer installed.

## Decision

1. **One size and one safe area.** Every card is 1200 × 630, the size the theme already declares, with an 80 px margin. Everything that must be read sits inside 1040 × 470.

2. **Five things, in reading order.** The mark in its dark colorway, the site name, a section label, the title, and the page URL in a footer rule. The section is the sidebar group on a doc page; otherwise the label of the first `_data/navigation.yml` main entry whose URL prefixes the page URL; otherwise the layout name in title case. Both top labels stay on one line and are ellipsized before they meet in the middle. The footer drops the scheme and is ellipsized to the safe width.

3. **The title owns three lines.** Set at 72 px on an 84 px line height (56 px on 66 px when it shrinks) and bottom-aligned above the footer rule, so a short title sits low. A title that still overflows 1040 px on three lines shrinks to 56 px, then truncates with an ellipsis. Lines break at word boundaries; a single word longer than the line breaks anywhere. The block always occupies the same region, whatever its line count, so a long title never reaches the top labels.

4. **The template is one inert SVG.** `assets/og/template.svg` is the design source. It uses `${site}`, `${section}`, `${title.line1}` through `${title.line3}`, and `${url}` as placeholders; a filler replaces them with XML-escaped values and removes the empty title lines. The file has no front matter, so Jekyll copies it into the built site untouched. It carries the geometry of `tools/brand/mark.mjs` and the colors of `brand/tokens.json`; when either changes, the template is regenerated, and the renderer task adds a test that compares the two. The layout variants (#762) copy it, keep these placeholders, and add their own field.

5. **Classic Pages stays manual.** Without plugins there is no generation: `assets/images/social.png` stays the default and a page points at its own picture with `image` ([ADR 0015](0015-og-images.md), rule 1). The template is the starting point for that work — copy it, fill the placeholders, export a PNG, commit it, set `image`. The renderer task updates the row in `docs/modes.md` when the generated card lands.

6. **Actions mode fills and rasterizes when it can.** A build step (#758) reads each page's title, section, language, and URL from `sourcemap.json`, fills the template, writes the SVG under `assets/og/`, and rasterizes it to PNG with a pinned renderer (resvg or the headless browser the tests already install). This is where ADR 0015's pure-Ruby rule gives way; its card remains the fallback when no renderer is present. A missing renderer is a skip with one notice, not a failed build, the way the browser checks skip without Playwright.

7. **Fonts are named, never fetched.** The card sets type in the brand stacks `tools/brand/templates.mjs` already uses: Inter, then Vazirmatn for any glyph Inter lacks, then the system UI sans; IBM Plex Mono for the section and URL. The rasterizer is pointed at the theme's `assets/fonts/` where it takes a font directory, so Persian has a real face; otherwise it uses what the machine has. Nothing is loaded over the network. Because metrics differ by a pixel or two between machines, line breaks come from an estimated width and the title block reserves its lines; the design never sizes itself from measured text.

8. **Right to left is one attribute and one anchor.** On a page whose language is right to left, the title gets `direction="rtl"` and `text-anchor="start"` (the start edge of right-to-left text) and sits at x = 1120, so it begins at the right margin and runs left; the title and the section drop their letter-spacing, because spacing between joined Persian letters is wrong, and the section falls through to Vazirmatn. The mark, the site name, the section label, and the footer keep their places, so a bilingual site's cards read as one family. The template comment shows both forms.

9. **The palette is the brand palette.** Canvas background, light title, bronze section and rule, mist footer: 16.1:1, 6.7:1, and 6.5:1 against the background, all above the 4.5:1 the brand guide requires for text. The mark is the dark colorway.

10. **Failure is quiet and stays shareable.** A page resolves its image in this order: `image`, designed card, interim [ADR 0015](0015-og-images.md) card, shared `social.png`. A card that cannot be filled or rasterized keeps the next one; a page never ends up with an empty or broken `og:image`.

## Consequences

- A shared link shows the page that was shared, in the brand's type, with its section and URL.
- Classic Pages sites reach the same result only by hand; the template makes that copy-and-export work, and the check in #759 keeps committed exports from going stale.
- The pure-Ruby card survives as the floor, so a build without a renderer still gets per-page pictures.
- Persian, Arabic, and Hebrew cards arrive with the renderer and a covering font; until then those titles keep the ADR 0015 fallback, as 0015 rule 5 anticipated.
- The template is one more inert asset the theme ships. Adding it to the gem changes nothing until a filler uses it.
- The footer URL makes a card self-describing, but the page's meta tags remain the contract (#761).

## What is left out

- **The filler and the rasterizer** (#758), the layout variants (#762), the meta tags (#761), and the classic-Pages check (#759). This ADR fixes the design and the template those tasks build against.
- **A bundled typeface for pixel-identical cards.** The brand templates already accept fallback metrics; if exactness ever matters, the filler can outline the text as paths without changing this contract.
