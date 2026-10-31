import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("cards block renders a grid of linked and plain cards", { skip }, () => {
  const outDir = join(root, ".tmp/block-cards-out");
  const testSite = join(root, ".tmp/block-cards-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
cards:
  - title: First card
    url: /first.html
    label: Start here
    description: The first description.
  - title: Second card
    description: A card with no link.
  - title: "Use <em>tags</em>"
    url: https://example.org/third
    description: The third description.
one:
  - title: Only card
plain:
  - title: No destination
    description: Nothing to link to.
---
{% include blocks/cards.html items=page.cards %}
{% include blocks/cards.html items=page.one columns=2 %}
{% include blocks/cards.html items=page.one columns=9 %}
{% include blocks/cards.html items=page.one columns="many" %}
{% include blocks/cards.html items=page.plain columns=1 %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(
    join(testSite, "_layouts", "default.html"),
    `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`,
  );

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  // The first list is the three-card example.
  const listStart = html.indexOf('<ul class="sl-cards"');
  const list = html.slice(listStart, html.indexOf("</ul>", listStart));
  const cards = [...list.matchAll(/<li class="sl-card">[\s\S]*?<\/li>/g)].map((match) => match[0]);

  assert.equal(cards.length, 3, "Should render one card per item");
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/cards.css"'), "Should link the cards component CSS");

  // Titles, links, labels, and descriptions, in order.
  assert.ok(cards[0].includes('<span class="sl-card-title">First card</span>'), "Should render the first title");
  assert.ok(cards[1].includes('<span class="sl-card-title">Second card</span>'), "Should render the second title");
  assert.ok(cards[2].includes('<span class="sl-card-title">Use &lt;em&gt;tags&lt;/em&gt;</span>'), "Should escape HTML in a title");
  assert.ok(cards[0].includes('<a class="sl-card-link" href="/first.html">'), "Should link the whole card to a relative url");
  assert.ok(cards[2].includes('<a class="sl-card-link" href="https://example.org/third">'), "Should leave an external url alone");
  assert.ok(cards[0].includes('<span class="sl-card-label">Start here</span>'), "Should render the optional label");
  assert.ok(cards[0].includes('<span class="sl-card-description">The first description.</span>'), "Should render the description");

  // A card without url is a plain description card with no anchor.
  assert.ok(cards[1].includes('<div class="sl-card-body">'), "Should render a card without url as a plain card");
  assert.ok(!cards[1].includes("<a "), "Should render no anchor when the card has no url");

  // columns is clamped to 1-4, and an invalid value falls back to 3.
  assert.equal(html.match(/style="--sl-cards-columns: 3"/g)?.length, 2, "Should default to three columns and treat an invalid value as three");
  assert.equal(html.match(/style="--sl-cards-columns: 2"/g)?.length, 1, "Should pass a valid column count through");
  assert.equal(html.match(/style="--sl-cards-columns: 4"/g)?.length, 1, "Should clamp columns above four");
  assert.equal(html.match(/style="--sl-cards-columns: 1"/g)?.length, 1, "Should clamp columns below one");
});
