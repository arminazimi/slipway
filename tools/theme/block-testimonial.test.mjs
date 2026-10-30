import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("testimonial block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-testimonial-out");
  const testSite = join(root, ".tmp/block-testimonial-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
testimonial:
  quote: Publishing is fast now.
  name: Mina Rahimi
  role: Documentation lead
  avatar: /assets/avatar.png
  avatar_alt: Portrait of Mina Rahimi
  source_url: https://example.com/reviews
  source_label: Example review
---
{% include blocks/testimonial.html quote=page.testimonial.quote name=page.testimonial.name role=page.testimonial.role avatar=page.testimonial.avatar avatar_alt=page.testimonial.avatar_alt source_url=page.testimonial.source_url source_label=page.testimonial.source_label %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  writeFileSync(join(testSite, "empty.md"), `---
layout: default
---
{% include blocks/testimonial.html quote="" %}`);

  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="testimonial" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<figure class="sl-testimonial">'), "Should render the testimonial figure");
  assert.ok(html.includes("<blockquote><p>Publishing is fast now.</p></blockquote>"), "Should render the quote in a blockquote");
  assert.ok(html.includes('<figcaption class="sl-testimonial-credit">'), "Should render the credit row");
  assert.ok(html.includes('<cite class="sl-testimonial-name">Mina Rahimi</cite>'), "Should render the name in a cite element");
  assert.ok(html.includes('<span class="sl-testimonial-role">Documentation lead</span>'), "Should render the role");
  assert.ok(html.includes('<img class="sl-testimonial-avatar" src="/assets/avatar.png" alt="Portrait of Mina Rahimi"'), "Should render the avatar with its alt text");
  assert.ok(html.includes('<a class="sl-testimonial-source" href="https://example.com/reviews">Example review</a>'), "Should render the source link");
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/testimonial.css">'), "Should link the testimonial component CSS");

  const empty = readFileSync(join(outDir, "empty.html"), "utf8");
  assert.ok(!empty.includes("sl-testimonial"), "Should render nothing when the quote is empty");
});
