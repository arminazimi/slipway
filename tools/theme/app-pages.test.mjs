import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample, root } from "./build.mjs";
import { tmpDir } from "./tmp.mjs";

const site = join(root, "tools/theme/fixtures/app-page");
for (const mode of ["gem", "template"]) {
  test(`static HTML apps pass through unchanged and stay out of indexes (${mode})`, { skip: !bundleAvailable() }, () => {
    const out = buildExample(mode, tmpDir(`app-page-${mode}`), site, { baseurl: "/product" });
    for (const name of ["index.html", "style.css", "dashboard.js", "data.json"]) {
      const path = join("dashboard", name);
      assert.deepEqual(readFileSync(join(out, path)), readFileSync(join(site, path)), path);
    }
    const search = JSON.parse(readFileSync(join(out, "search.json"), "utf8"));
    assert.ok(search.some((page) => page.title === "Product docs"));
    assert.ok(search.every((page) => !page.url.includes("dashboard")));
    const map = JSON.parse(readFileSync(join(out, "sourcemap.json"), "utf8"));
    assert.ok(map.pages.some((page) => page.source === "index.md"));
    assert.ok(map.pages.every((page) => !page.source.includes("dashboard")));
    for (const name of ["llms.txt", "llms-full.txt"]) {
      const text = readFileSync(join(out, name), "utf8");
      assert.match(text, /Product docs/);
      assert.doesNotMatch(text, /Independent dashboard|dashboard\/|dashboard\.js|data\.json/);
    }
    assert.match(readFileSync(join(out, "index.html"), "utf8"), /href="\/product\/dashboard\/"/);
  });
}
