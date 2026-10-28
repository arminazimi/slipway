import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const script = read("assets/js/copy-code.js");

function run() {
  const context = { document: undefined };
  context.globalThis = context;
  vm.runInNewContext(script, context);
  return context.slipwayCopy;
}

test("the copy button labels are English by default and Persian for fa", () => {
  const { label } = run();
  assert.equal(label("en", "copy"), "Copy");
  assert.equal(label("fa-IR", "done"), "کپی شد");
  assert.equal(label("de", "copy"), "Copy");
  assert.equal(label(undefined, "copy"), "Copy");
});

test("the copy script is small and loaded deferred from the head", () => {
  assert.ok(Buffer.byteLength(script) < 2100);
  assert.match(read("_includes/head.html"), /copy-code\.js' \| relative_url \}\}" defer/);
});

test("code stays left-to-right inside right-to-left pages, with logical properties", () => {
  const css = read("assets/css/slipway.css");
  assert.match(css, /\.sl-code\s*\{[^}]*direction:\s*ltr;/);
  assert.match(css, /pre\s*\{[^}]*direction:\s*ltr;\s*text-align:\s*start;/);
  assert.doesNotMatch(css.slice(css.indexOf("Code blocks:")), /\b(left|right|margin-left|margin-right)\s*:/);
});

test("tables have responsive styles and logical text alignment", () => {
  const css = read("assets/css/slipway.css");
  assert.match(css, /table\s*\{[^}]*display:\s*block;[^}]*overflow-x:\s*auto;/);
  assert.match(css, /th,\s*td\s*\{[^}]*text-align:\s*start;/);
});

test("syntax colors use tokens that pass contrast on the surface", () => {
  const css = read("assets/css/slipway.css").slice(read("assets/css/slipway.css").indexOf("Code blocks:"));
  const colors = [...css.matchAll(/\.highlight[^{]*\{[^}]*color: var\((--sl-color-[a-z-]+)\)/g)].map((m) => m[1]);
  for (const c of colors) assert.ok(["--sl-color-muted", "--sl-color-rose", "--sl-color-heading"].includes(c), c);
});

test("the copy button is not printed", () => {
  assert.match(read("assets/css/print.css"), /\.sl-copy \{\s*display: none;/);
});
