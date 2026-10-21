import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const fontsCss = read("assets/css/fonts.css");
const faces = [...fontsCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => ({
  family: /font-family:\s*"([^"]+)"/.exec(body)[1],
  style: /font-style:\s*(\w+)/.exec(body)[1],
  display: /font-display:\s*(\w+)/.exec(body)?.[1],
  file: join(root, "assets/css", /url\("([^"]+)"\)/.exec(body)[1]),
}));
const licenses = { "Instrument Serif": "InstrumentSerif-OFL.txt", "Source Serif 4": "SourceSerif4-OFL.txt", Vazirmatn: "Vazirmatn-OFL.txt" };

test("every font file in fonts.css exists and every face uses font-display: swap", () => {
  assert.equal(faces.length, 5);
  for (const face of faces) {
    assert.ok(existsSync(face.file), face.file);
    assert.equal(face.display, "swap", face.file);
  }
});

test("every font family ships with its license", () => {
  for (const family of new Set(faces.map((f) => f.family))) {
    assert.ok(existsSync(join(root, "assets/fonts/LICENSES", licenses[family])), family);
  }
});

test("the default faces (no italics) stay within the 130 KB budget of ADR 0004", () => {
  const bytes = faces.filter((f) => f.style === "normal").reduce((sum, f) => sum + statSync(f.file).size, 0);
  assert.ok(bytes <= 130 * 1024, `${bytes} bytes`);
});

test("the head loads fonts.css and preloads only the body font", () => {
  const head = read("_includes/head.html");
  assert.ok(head.includes("assets/css/fonts.css"));
  assert.equal([...head.matchAll(/rel="preload"/g)].length, 1);
  assert.ok(head.indexOf("fonts.css") < head.indexOf("tokens.css"));
});

test("the stylesheets use logical properties, never left and right", () => {
  const physical = /\b(margin|padding|border)-(left|right)\b|text-align:\s*(left|right)|(^|[\s{;])(left|right)\s*:|float:\s*(left|right)/m;
  for (const file of ["assets/css/slipway.css", "assets/css/fonts.css"]) assert.doesNotMatch(read(file), physical, file);
});

test("sections are numbered with a CSS counter between hairline rules", () => {
  const css = read("assets/css/slipway.css");
  assert.match(css, /counter-increment: sl-section/);
  assert.match(css, /counter\(sl-section, decimal-leading-zero\)/);
  assert.match(css, /\.sl-sections > h2 \{[^}]*border-block-start: var\(--sl-rule\) solid var\(--sl-color-line\)/);
});

test("Persian headings use the Persian stack, which has no Latin-only display face first", () => {
  assert.match(read("assets/css/slipway.css"), /:lang\(fa\) :is\(h1, h2, h3\)/);
  assert.match(read("assets/css/tokens.css"), /--sl-font-persian: Vazirmatn, "Source Serif 4"/);
});
