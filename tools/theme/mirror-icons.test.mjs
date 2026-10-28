import { test } from "node:test";
import * as assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";

test("Directional icons mirror in right-to-left; others never do", async () => {
  const includesDir = "_includes";
  const files = await fs.readdir(includesDir, { recursive: true });

  const directional = new Set();
  const notDirectional = new Set([
    "icons/github.svg",
    "icons/linkedin.svg",
    "icons/mastodon.svg",
    "icons/twitter.svg",
    "icons/x.svg",
    "icons/youtube.svg",
    "blocks/compare.html",
    "header.html",
  ]);

  for (const file of files) {
    const filePath = path.join(includesDir, file);
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) continue;
    if (!file.endsWith(".svg") && !file.endsWith(".html")) continue;

    const content = await fs.readFile(filePath, "utf-8");
    if (!content.includes("<svg")) continue;

    // Use forward slash for paths
    const relPath = file.replace(/\\/g, '/');

    assert.ok(
      directional.has(relPath) || notDirectional.has(relPath),
      `File ${relPath} contains an SVG but is not categorized as directional or non-directional.`
    );

    if (directional.has(relPath)) {
      assert.match(content, /class="[^"]*\bsl-mirror\b[^"]*"/, `Directional icon ${relPath} must have the sl-mirror class.`);
    }

    if (notDirectional.has(relPath)) {
      assert.doesNotMatch(content, /class="[^"]*\bsl-mirror\b[^"]*"/, `Non-directional icon ${relPath} must not have the sl-mirror class.`);
    }
  }
});
