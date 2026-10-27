import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";
import { tmpDir } from "./tmp.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const head = (html) => html.split("</head>")[0];

test("canonical_url and description from front matter are used in SEO tags and JSON-LD", { skip }, () => {
  const out = buildExample("gem", tmpDir("kit-canonical-site"), "/app/tools/theme/fixtures/kit-canonical");

  const index = head(readFileSync(join(out, "index.html"), "utf8"));
  assert.match(index, /<link rel="canonical" href="https:\/\/example\.org\/canonical-index\/">/);
  assert.match(index, /<meta property="og:url" content="https:\/\/example\.org\/canonical-index\/">/);
  assert.match(index, /<meta property="og:description" content="This is a canonical index description\.">/);
  assert.match(index, /"url":"https:\/\/example\.org\/canonical-index\/"/);
  assert.match(index, /"description":"This is a canonical index description\."/);

  const rtl = head(readFileSync(join(out, "rtl.html"), "utf8"));
  assert.match(rtl, /<link rel="canonical" href="https:\/\/example\.org\/canonical-rtl\/">/);
  assert.match(rtl, /<meta property="og:url" content="https:\/\/example\.org\/canonical-rtl\/">/);
  assert.match(rtl, /<meta property="og:description" content="This is a canonical rtl description\.">/);
  assert.match(rtl, /"url":"https:\/\/example\.org\/canonical-rtl\/"/);
  assert.match(rtl, /"description":"This is a canonical rtl description\."/);

  const noJs = head(readFileSync(join(out, "no-js.html"), "utf8"));
  assert.match(noJs, /<link rel="canonical" href="https:\/\/example\.org\/canonical-no-js\/">/);
  assert.match(noJs, /<meta property="og:url" content="https:\/\/example\.org\/canonical-no-js\/">/);
  assert.match(noJs, /<meta property="og:description" content="This is a canonical no-js description\.">/);
  assert.match(noJs, /"url":"https:\/\/example\.org\/canonical-no-js\/"/);
  assert.match(noJs, /"description":"This is a canonical no-js description\."/);
});
