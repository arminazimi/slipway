import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("people block renders a list and an authors map", { skip }, () => {
  const outDir = join(root, ".tmp/block-people-out");
  const testSite = join(root, ".tmp/block-people-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
people:
  - name: Ada Lovelace
    role: Mathematician
    avatar: https://example.org/ada.png
    avatar_alt: Ada Lovelace portrait
    url: /about.html
    links:
      - label: Notes
        url: /notes.html
      - label: Mastodon
        url: https://example.org/@ada
  - name: Grace Hopper
---
{% include blocks/people.html people=page.people id="team" %}
{% include blocks/people.html people=site.data.authors %}`;

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

  mkdirSync(join(testSite, "_data"), { recursive: true });
  writeFileSync(
    join(testSite, "_data", "authors.yml"),
    `ada:
  name: Ada Rahimi
  bio: Writes about type and speed.
  avatar: /assets/img/ada.svg
  links:
    - title: Website
      url: https://example.org/ada
    - title: About this blog
      url: /about.html
sam:
  name: Sam Okafor
`,
  );

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  // A list and a map both render, with one card per person.
  assert.ok(html.includes('<ul class="sl-people" id="team">'), "Should render the people list with the id");
  assert.equal(html.match(/<li class="sl-person">/g)?.length, 4, "Should render a card for each person in the list and the map");

  // Names, roles, and links.
  assert.ok(html.includes('<a href="/about.html">Ada Lovelace</a>'), "Should link a name when the person has a url");
  assert.ok(html.includes("Grace Hopper"), "Should render a person without a url as plain text");
  assert.ok(html.includes('<span class="sl-person-role">Mathematician</span>'), "Should render the role");
  assert.ok(html.includes('<a href="/notes.html">Notes</a>'), "Should render internal links with the site path");
  assert.ok(html.includes('<a href="https://example.org/@ada">Mastodon</a>'), "Should leave external links alone");

  // A map shaped like _data/authors.yml: bio as the role, links[].title as the label.
  assert.ok(html.includes("Ada Rahimi"), "Should render the map's names");
  assert.ok(html.includes("Sam Okafor"), "Should render every entry of the map");
  assert.ok(html.includes('<span class="sl-person-role">Writes about type and speed.</span>'), "Should render the bio as the role");
  assert.ok(html.includes('<a href="/about.html">About this blog</a>'), "Should render map links from their title");

  // Avatars.
  assert.ok(
    html.includes('<img class="sl-person-avatar" src="https://example.org/ada.png" alt="Ada Lovelace portrait"'),
    "Should render the avatar with avatar_alt",
  );
  assert.ok(
    html.includes('<img class="sl-person-avatar" src="/assets/img/ada.svg" alt="Ada Rahimi"'),
    "Should resolve an internal avatar and default its alt to the name",
  );

  // The include links its own stylesheet. Kramdown makes the void element self-closing.
  assert.ok(
    html.includes('<link rel="stylesheet" href="/assets/css/components/people.css"'),
    "Should link the people component CSS",
  );
});
