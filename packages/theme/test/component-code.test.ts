import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { renderToString } from "preact-render-to-string";
import type { ComponentProps } from "@velella/mizzen/contracts";
import code, { buildTheme, loadGrammars, loadedLanguages, sourceText } from "../components/code/index.ts";

function render(props: Record<string, string>, html: string): string {
  const input = { props, html, page: {}, site: {} } as unknown as ComponentProps<never>;
  return renderToString(code(input as never) as never);
}

const css = readFileSync(new URL("../components/code/style.css", import.meta.url), "utf8");
const names = JSON.parse(readFileSync(new URL("../tokens/names.json", import.meta.url), "utf8")) as Record<string, Record<string, unknown>>;
const tokenNames = new Set(Object.entries(names).flatMap(([g, e]) => Object.keys(e).map((n) => `${g}-${n}`)));

test("sourceText strips tags and decodes entities", () => {
  assert.equal(sourceText('<pre><code class="language-ts">a &lt; b &amp;&amp; c\n</code></pre>'), "a < b && c");
});

test("loads only the grammars asked for", async () => {
  assert.deepEqual(loadedLanguages().filter((l) => l !== "text"), []);
  await loadGrammars(["json", "nope"]);
  assert.ok(loadedLanguages().includes("json"));
  assert.ok(!loadedLanguages().includes("typescript"));
});

test("highlights at build time with light and dark variables, keeps data-src", async () => {
  await loadGrammars(["json"]);
  const out = render({ lang: "json", src: "docs/a.md:3" }, "{&quot;a&quot;: 1}");
  assert.match(out, /<pre class="code"[^>]*data-src="docs\/a\.md:3"/);
  assert.match(out, /--shiki-light:#/);
  assert.match(out, /--shiki-dark:#/);
  assert.doesNotMatch(out, /<script/);
});

test("an unloaded language renders as plain escaped text", () => {
  const out = render({ lang: "klingon" }, "a &lt; b");
  assert.match(out, /a (&lt;|&#x3C;) b/);
});

test("the light theme comes from names.json while code.light.json is absent", () => {
  assert.equal(buildTheme("light").colors?.["editor.background"], "#f5f5f5");
});

test("the dark theme comes from code.dark.json (#1096)", () => {
  assert.equal(buildTheme("dark").name, "lateen-dark");
  assert.equal(buildTheme("dark").colors?.["editor.background"], "#2a2a37");
  assert.ok(buildTheme("dark").settings?.some((s) => s.scope?.includes("keyword")));
});

test("styles scroll inside the block and use only known tokens", () => {
  assert.match(css, /overflow-x:\s*auto/);
  for (const [, name] of css.matchAll(/var\(--([a-z0-9-]+)/g)) {
    if (name!.startsWith("shiki-")) continue;
    assert.ok(tokenNames.has(name!), `unknown token --${name}`);
  }
});
