import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

const anchor = (provider, href) =>
  `<a class="sl-embed sl-embed-${provider}" href="${href}" target="_blank" rel="noopener noreferrer">`;

test("embed block renders a privacy-first link for each provider", { skip }, () => {
  const outDir = join(root, ".tmp/block-embed-out");
  const testSite = join(root, ".tmp/block-embed-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
---
{% include blocks/embed.html provider="youtube" id="aqz-KE-bpKQ" title="A talk" %}
{% include blocks/embed.html provider="vimeo" id="76979871" title="A film" %}
{% include blocks/embed.html provider="aparat" id="6b9n4z" title="A clip" %}
{% include blocks/embed.html provider="example" id="fallback1" title="Unknown provider" %}
{% include blocks/embed.html provider="youtube" title="No id" %}
{% include blocks/embed.html provider="youtube" id="escaping" title="<b>Not bold</b>" %}`;

  writeFileSync(join(testSite, "index.html"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(
    html.includes(anchor("youtube", "https://www.youtube-nocookie.com/watch?v=aqz-KE-bpKQ")),
    "Should link YouTube videos through youtube-nocookie.com",
  );
  assert.ok(
    html.includes(anchor("vimeo", "https://vimeo.com/76979871")),
    "Should link Vimeo videos on vimeo.com",
  );
  assert.ok(
    html.includes(anchor("aparat", "https://www.aparat.com/v/6b9n4z")),
    "Should link Aparat videos on aparat.com",
  );
  assert.ok(
    html.includes(anchor("youtube", "https://www.youtube-nocookie.com/watch?v=fallback1")),
    "Should fall back to YouTube for an unknown provider",
  );

  assert.ok(html.includes('<span class="sl-embed-provider">YouTube</span>'), "Should label the YouTube card");
  assert.ok(html.includes('<span class="sl-embed-provider">Vimeo</span>'), "Should label the Vimeo card");
  assert.ok(html.includes('<span class="sl-embed-provider">Aparat</span>'), "Should label the Aparat card");
  assert.ok(html.includes('<span class="sl-embed-title">A talk</span>'), "Should show the title");

  assert.ok(!html.includes("No id"), "Should render nothing without an id");
  assert.equal(
    [...html.matchAll(/<a class="sl-embed sl-embed-/g)].length,
    5,
    "Should render one card per include that has an id",
  );
  assert.ok(html.includes("&lt;b&gt;Not bold&lt;/b&gt;"), "Should escape the title");
  assert.ok(!html.includes("<b>Not bold</b>"), "Should not render a title as HTML");

  assert.ok(!html.includes("<iframe"), "Should not embed an iframe");
  assert.doesNotMatch(
    html,
    /src="[^"]*(?:youtube|youtu\.be|vimeo|aparat)/i,
    "Should not load anything from a provider before a click",
  );

  assert.ok(
    html.includes('<link rel="stylesheet" href="/assets/css/components/embed.css">'),
    "Should link the embed component CSS",
  );
});
