import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { buildExample, bundleAvailable } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

const query = (twin) => `Read+https%3A%2F%2Fexample.com${twin.replaceAll("/", "%2F")}+and+wait+for+my+question.`;

function links(html, twin, label) {
  const q = query(twin);
  assert.ok(html.includes(`href="https://claude.ai/new?q=${q}"`), `${label}: Claude link carries the encoded Markdown URL`);
  assert.ok(html.includes(`href="https://chatgpt.com/?q=${q}"`), `${label}: ChatGPT link carries the encoded Markdown URL`);
  assert.ok(html.includes(">Open in Claude</a>"), `${label}: Claude link reads without JavaScript`);
  assert.ok(html.includes(">Open in ChatGPT</a>"), `${label}: ChatGPT link reads without JavaScript`);
  assert.ok(!/<a class="sl-open-in-agent-link"[^>]*\shidden/.test(html), `${label}: links are not hidden until a script runs`);
  assert.ok(html.includes('<link rel="stylesheet" href="/assets/css/components/open-in-agent.css">'), `${label}: component CSS is linked`);
}

test("open-in-agent links pass each page's Markdown twin", { skip }, () => {
  const outDir = join(root, ".tmp/open-in-agent-out");
  const testSite = join(root, ".tmp/open-in-agent-site");
  mkdirSync(join(testSite, "guide"), { recursive: true });
  mkdirSync(join(testSite, "docs"), { recursive: true });
  mkdirSync(join(testSite, "_posts"), { recursive: true });
  writeFileSync(
    join(testSite, "_config.yml"),
    ["url: https://example.com", "theme: slipway-theme", "future: true", ""].join("\n"),
  );
  writeFileSync(
    join(testSite, "guide", "index.md"),
    "---\ntitle: Guide\nlayout: page\npermalink: /guide/\n---\n\nA page at a directory URL.\n",
  );
  writeFileSync(
    join(testSite, "plain.md"),
    "---\ntitle: Plain\nlayout: page\npermalink: /plain.html\n---\n\nA page at an .html URL.\n",
  );
  writeFileSync(
    join(testSite, "docs", "install.md"),
    "---\ntitle: Install\nlayout: doc\npermalink: /docs/install/\n---\n\nA documentation page.\n",
  );
  writeFileSync(
    join(testSite, "_posts", "2020-01-01-hello.md"),
    "---\ntitle: Hello\nlayout: post\npermalink: /hello.html\n---\n\nA post.\n",
  );
  writeFileSync(
    join(testSite, "listing.md"),
    "---\ntitle: Listing\nlayout: home\npermalink: /listing.html\n---\n\nA listing page.\n",
  );

  buildExample("template", outDir, testSite);

  links(readFileSync(join(outDir, "guide", "index.html"), "utf8"), "/guide/index.md", "directory page");
  links(readFileSync(join(outDir, "plain.html"), "utf8"), "/plain.md", ".html page");
  links(readFileSync(join(outDir, "docs", "install", "index.html"), "utf8"), "/docs/install/index.md", "doc page");
  links(readFileSync(join(outDir, "hello.html"), "utf8"), "/hello.md", "post");

  const listing = readFileSync(join(outDir, "listing.html"), "utf8");
  assert.ok(!listing.includes("sl-open-in-agent"), "a listing layout does not get the links");
});
