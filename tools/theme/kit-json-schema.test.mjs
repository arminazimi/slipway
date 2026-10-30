import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";
import { tmpDir } from "./tmp.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const fixture = join(root, "tools/theme/fixtures/schema-table");

test("the schema table renders property rows, nested objects, enum, and oneOf", { skip }, () => {
  const out = buildExample("gem", tmpDir("schema-table-site"), fixture);
  const html = readFileSync(join(out, "index.html"), "utf8");
  const row = (name) => {
    const match = html.match(new RegExp(`<th scope="row" class="sl-schema-name"><code>${name}</code></th>[\\s\\S]*?</tr>`));
    assert.ok(match, `renders a row for ${name}`);
    return match[0];
  };

  assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/components\/schema-table\.css"[^>]*>/);
  assert.match(html, /<table class="sl-schema-table">/);
  for (const header of ["Name", "Type", "Required", "Default", "Description"]) {
    assert.match(html, new RegExp(`<th scope="col">${header}</th>`), `renders the ${header} column`);
  }

  const mode = row("mode");
  assert.match(mode, /<td class="sl-schema-type"><code>string<\/code>/);
  assert.match(mode, /<li><code>auto<\/code><\/li><li><code>manual<\/code><\/li>/);
  assert.match(mode, /<td class="sl-schema-required">\s*Yes\s*<\/td>/);
  assert.match(mode, /<td class="sl-schema-default">\s*<code>"auto"<\/code>/);
  assert.match(mode, /<p>How the widget runs\.<\/p>/);

  assert.match(row("name"), /<td class="sl-schema-required">\s*Yes\s*<\/td>/);
  assert.match(row("name"), /<td class="sl-schema-default"><\/td>/);
  assert.match(row("enabled"), /<code>false<\/code>/);
  assert.match(row("retries"), /<code>0<\/code>/);
  assert.match(row("layout"), /<code>string \| object<\/code>/);
  assert.match(row("notes"), /<td class="sl-schema-type"><\/td>/);
  assert.match(row("notes"), /<td class="sl-schema-description"><\/td>/);

  assert.match(html, /<tr class="sl-schema-children">/);
  assert.match(html, /<table class="sl-schema-table sl-schema-table-nested">/);
  assert.match(row("timeout"), /<td class="sl-schema-required">\s*Yes\s*<\/td>/);
  assert.match(row("timeout"), /<code>30<\/code>/);
  assert.match(row("timeout"), /<p>Seconds before giving up\.<\/p>/);
  assert.match(row("label"), /<td class="sl-schema-required">\s*No\s*<\/td>/);
  assert.match(row("id"), /<td class="sl-schema-required">\s*Yes\s*<\/td>/);
  assert.match(row("title"), /<p>Step title\.<\/p>/);
});

test("the schema table renders nothing for a missing schema", { skip }, () => {
  const out = buildExample("gem", tmpDir("schema-table-empty"), fixture);
  const html = readFileSync(join(out, "empty.html"), "utf8");
  assert.doesNotMatch(html, /sl-schema-table/);
  assert.doesNotMatch(html, /schema-table\.css/);
});

test("the schema table stylesheet uses logical properties", () => {
  const css = readFileSync(join(root, "assets/css/components/schema-table.css"), "utf8");
  assert.match(css, /text-align:start/);
  assert.match(css, /padding-inline-start/);
  assert.doesNotMatch(css, /(margin|padding|border)-(left|right)/);
  assert.doesNotMatch(css, /text-align:(left|right)/);
});
