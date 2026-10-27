import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");

test("header includes the mobile navigation drawer markup", () => {
  const header = read("_includes/header.html");
  assert.match(header, /id="sl-nav-state"/);
  assert.match(header, /class="sl-nav-toggle"/);
  assert.match(header, /class="sl-nav-backdrop"/);
  assert.match(header, /class="sl-nav-drawer"/);
});

test("head includes nav.css", () => {
  const head = read("_includes/head.html");
  assert.match(head, /'\/assets\/css\/nav\.css'/);
});
