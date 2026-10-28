import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { copyStarter, repoSources } from "../../packages/create-slipway/src/sources.mjs";
import { bundleAvailable, buildExample, root } from "./build.mjs";
import { tmpDir } from "./tmp.mjs";

test("output stubs contain only front matter and select existing theme layouts", () => {
  for (const name of ["search.json", "404.md"]) {
    const source = readFileSync(join(root, "starter-files", name), "utf8");
    const match = /^---\n([\s\S]*?)\n---\s*$/.exec(source);
    assert.ok(match, `${name} is front matter only`);
    const data = parse(match[1]);
    assert.ok(existsSync(join(root, "_layouts", `${data.layout}.html`)));
    assert.equal(readFileSync(join(root, "examples/minimal", name), "utf8"), source);
  }
});

for (const mode of ["gem", "template"]) {
  test(`bare plus the starter bundle gets search, 404, feed and sitemap (${mode})`, { skip: !bundleAvailable() }, () => {
    const site = tmpDir(`starter-files-${mode}-source`);
    copyStarter(repoSources(), site);
    writeFileSync(join(site, "_config.yml"), "title: Starter\ntheme: slipway-theme\nplugins:\n  - jekyll-feed\n  - jekyll-sitemap\n");
    const out = buildExample(mode, tmpDir(`starter-files-${mode}-out`), site);
    for (const name of ["search.json", "404.html", "feed.xml", "sitemap.xml"]) assert.ok(existsSync(join(out, name)), name);
    assert.ok(JSON.parse(readFileSync(join(out, "search.json"), "utf8")).length > 0);
    assert.match(readFileSync(join(out, "feed.xml"), "utf8"), /<feed\b/);
    assert.match(readFileSync(join(out, "sitemap.xml"), "utf8"), /<urlset\b/);
  });
}
