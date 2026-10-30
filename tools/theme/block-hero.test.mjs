import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

const heroInclude = `{% include blocks/hero.html id=page.hero.id title=page.hero.title lead=page.hero.lead primary_url=page.hero.primary_url primary_label=page.hero.primary_label secondary_url=page.hero.secondary_url secondary_label=page.hero.secondary_label image=page.hero.image image_alt=page.hero.image_alt %}`;

test("hero block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-hero-out");
  const testSite = join(root, ".tmp/block-hero-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(join(testSite, "_layouts", "default.html"), `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`);

  writeFileSync(join(testSite, "index.md"), `---
layout: default
hero:
  id: start
  title: Ship a site agents can edit
  lead: One include, two actions, and an optional image.
  primary_url: /install/
  primary_label: Install Slipway
  secondary_url: /guides/
  secondary_label: Read the guides
  image: /assets/images/social.png
  image_alt: The Slipway social card
---
${heroInclude}`);

  // A URL with no label, and no second action, renders no actions group at all.
  writeFileSync(join(testSite, "partial.md"), `---
layout: default
hero:
  title: Only a title
  primary_url: /install/
---
${heroInclude}`);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(
    html.includes('<section class="sl-hero" id="start" aria-labelledby="start-title">'),
    "Should render the section, labelled by its title",
  );
  assert.ok(
    html.includes('<h2 class="sl-hero-title" id="start-title">Ship a site agents can edit</h2>'),
    "Should render the title",
  );
  assert.ok(html.includes("One include, two actions, and an optional image."), "Should render the lead");
  assert.ok(
    html.includes('<a class="sl-hero-action sl-hero-action-primary" href="/install/">Install Slipway</a>'),
    "Should render the primary action",
  );
  assert.ok(
    html.includes('<a class="sl-hero-action sl-hero-action-secondary" href="/guides/">Read the guides</a>'),
    "Should render the secondary action",
  );
  // Kramdown normalizes void tags, so allow the self-closing slash it adds.
  assert.match(
    html,
    /<img src="\/assets\/images\/social\.png" alt="The Slipway social card"\s*\/?>/,
    "Should render the image with its alt text",
  );
  assert.match(
    html,
    /<link rel="stylesheet" href="\/assets\/css\/components\/hero\.css"\s*\/?>/,
    "Should link the hero component CSS",
  );

  const partial = readFileSync(join(outDir, "partial.html"), "utf8");
  assert.ok(partial.includes('<section class="sl-hero">'), "Should render the section without an id");
  assert.ok(!partial.includes("sl-hero-actions"), "Should skip the actions group when no action is complete");
  assert.ok(!partial.includes("sl-hero-media"), "Should skip the media column when there is no image");
});
