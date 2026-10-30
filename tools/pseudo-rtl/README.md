# Pseudo-RTL check

Mirroring bugs hide in English-only pages: a physical `padding-left`, a border on one side, or an icon pinned with `inset-inline-start` looks right in LTR and wrong in RTL, and nobody notices until a Persian or Arabic site uses the theme.

This tool builds every example, renders each page first with `dir="ltr"` and then with `dir="rtl"`, and reports what does not mirror:

- **Spacing** — an element whose start and end padding, border, or margin differ in LTR must swap them in RTL. Equal values are skipped, so only asymmetric rules are judged.
- **Boxes** — an element narrower than its parent's content box must land at the mirrored position in RTL, whether it is start-aligned, end-aligned, or centered.
- **Insets** — an absolutely or fixed positioned element whose `left` and `right` differ must swap them.

It leaves alone what should not move: inline elements in running text (their position follows line breaking, not layout), content that pins its own direction with `dir="ltr"` (code blocks and terminals), and anything hidden.

To run it standalone:

```bash
node tools/pseudo-rtl/run.mjs
```

It needs Playwright with its browsers (`npx playwright install`) and Ruby with `bundle install` for the example builds; without them it prints a skip notice. It also runs as part of the tool checks:

```bash
npm run check:tools
```

The report names the page, the element (tag, `#id`, and up to two classes), and the property that failed, for example:

```
blog/index.html: blockquote sl-quote border: 4/0 LTR stays 4/0 in RTL
```
