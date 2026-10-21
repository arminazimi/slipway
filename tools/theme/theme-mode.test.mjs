import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const initScript = read("_includes/theme-init.html").replace(/^<script>|<\/script>\s*$/g, "");

/** Runs a script against stub browser globals. `store` may be an object or a function that throws. */
function run(code, { store = {}, throwing = false, buttons = [] } = {}) {
  const documentElement = { dataset: {} };
  const localStorage = throwing
    ? new Proxy({}, { get() { throw new Error("blocked"); } })
    : { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v), removeItem: (k) => delete store[k] };
  const context = { localStorage, document: { documentElement, querySelectorAll: () => buttons } };
  context.globalThis = context;
  vm.runInNewContext(code, context);
  return { context, documentElement, store };
}

const button = () => {
  const b = { hidden: true, textContent: "Theme", click: null, addEventListener(_, fn) { this.click = fn; } };
  return b;
};

test("the init script applies a stored light or dark choice and ignores anything else", () => {
  assert.equal(run(initScript, { store: { "slipway-theme": "dark" } }).documentElement.dataset.theme, "dark");
  assert.equal(run(initScript, { store: { "slipway-theme": "light" } }).documentElement.dataset.theme, "light");
  assert.equal(run(initScript, { store: { "slipway-theme": "purple" } }).documentElement.dataset.theme, undefined);
  assert.equal(run(initScript, {}).documentElement.dataset.theme, undefined);
});

test("the init script survives storage that throws and stays under 400 bytes", () => {
  assert.doesNotThrow(() => run(initScript, { throwing: true }));
  assert.ok(Buffer.byteLength(initScript) < 400);
});

test("the head sets the theme before any stylesheet loads", () => {
  const head = read("_includes/head.html");
  assert.ok(head.indexOf("theme-init.html") < head.indexOf("tokens.css"));
});

test("resolveMode falls back to auto and nextMode cycles auto, light, dark", () => {
  const { slipwayTheme } = run(read("assets/js/theme-toggle.js")).context;
  assert.equal(slipwayTheme.resolveMode("dark"), "dark");
  assert.equal(slipwayTheme.resolveMode("purple"), "auto");
  assert.equal(slipwayTheme.resolveMode(null), "auto");
  assert.deepEqual(["auto", "light", "dark"].map(slipwayTheme.nextMode), ["light", "dark", "auto"]);
});

test("clicking the toggle cycles the mode, stores it, and updates the label", () => {
  const b = button();
  const store = {};
  const { documentElement } = run(read("assets/js/theme-toggle.js"), { store, buttons: [b] });
  assert.equal(b.hidden, false);
  assert.equal(b.textContent, "Auto");
  b.click();
  assert.deepEqual([documentElement.dataset.theme, store["slipway-theme"], b.textContent], ["light", "light", "Light"]);
  b.click();
  assert.deepEqual([documentElement.dataset.theme, store["slipway-theme"], b.textContent], ["dark", "dark", "Dark"]);
  b.click();
  assert.deepEqual([documentElement.dataset.theme, store["slipway-theme"], b.textContent], [undefined, undefined, "Auto"]);
});

test("the toggle still works when storage throws", () => {
  const b = button();
  const { documentElement } = run(read("assets/js/theme-toggle.js"), { throwing: true, buttons: [b] });
  assert.doesNotThrow(() => b.click());
  assert.equal(documentElement.dataset.theme, "light");
});

test("the tokens stylesheet maps data-theme to color-scheme", () => {
  const css = read("assets/css/tokens.css");
  assert.match(css, /:root\[data-theme="dark"\] \{\s+color-scheme: dark;/);
  assert.match(css, /:root\[data-theme="light"\] \{\s+color-scheme: light;/);
});
