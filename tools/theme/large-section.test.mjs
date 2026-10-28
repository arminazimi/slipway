import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateNavigation } from "./navigation.mjs";
import { tmpDir } from "./tmp.mjs";

test("section match prefixes are optional site-local paths", () => {
  assert.ok(validateNavigation({ docs: [{ title: "Rules", url: "/reference/", match: "/rules/" }] }).ok);
  assert.ok(!validateNavigation({ docs: [{ title: "Rules", url: "/reference/", match: "https://example.com/" }] }).ok);
});

test("600 generated docs select their section within the existing 120s build budget", { skip: !bundleAvailable() }, () => {
  const site = tmpDir("large-section-source");
  for (const dir of ["_data", "rules/security", "rules/security-extra", "rules-extra"]) mkdirSync(join(site, dir), { recursive: true });
  writeFileSync(join(site, "_config.yml"), "title: Product\ntheme: slipway-theme\nurl: https://example.com\n");
  writeFileSync(join(site, "_data/navigation.yml"), `docs:
  - title: Introduction
    url: /intro/
  - title: Reference
    children:
      - title: Rules
        url: /reference/
        match: /rules/
      - title: Security rules
        url: /security/
        match: /rules/security
`);
  for (const name of ["intro", "reference", "security"]) {
    writeFileSync(join(site, `${name}.md`), `---\nlayout: doc\ntitle: ${name}\npermalink: /${name}/\n---\nPage.\n`);
  }
  for (let i = 0; i < 600; i++) {
    writeFileSync(join(site, "rules", `rule-${i}.md`), `---\nlayout: doc\ntitle: Rule ${i}\n---\n# Rule ${i}\n\n## Details\n\nDescription.\n`);
  }
  for (const path of ["rules/security/item", "rules/security-extra/item", "rules-extra/item"]) {
    writeFileSync(join(site, `${path}.md`), "---\nlayout: doc\ntitle: Extra\n---\nText.\n");
  }
  const start = performance.now();
  const out = buildExample("gem", tmpDir("large-section-out"), site, { baseurl: "/product" });
  const seconds = (performance.now() - start) / 1000;
  assert.ok(seconds <= 120, `600-page build took ${seconds.toFixed(1)}s (existing budget: 120s)`);
  for (let i = 0; i < 600; i++) {
    const html = readFileSync(join(out, "rules", `rule-${i}.html`), "utf8");
    assert.match(html, /href="\/product\/reference\/" aria-current="true">Rules/);
    assert.match(html, /<nav class="sl-breadcrumbs"[\s\S]*href="\/product\/reference\/">Rules/);
    assert.doesNotMatch(html, /class="sl-pager"/);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
    const lists = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const breadcrumb = lists.find((value) => value["@type"] === "BreadcrumbList");
    assert.equal(breadcrumb.itemListElement[1].name, "Rules");
  }
  const get = (path) => readFileSync(join(out, path), "utf8");
  assert.match(get("rules/security/item.html"), /href="\/product\/security\/" aria-current="true"/);
  assert.match(get("rules/security-extra/item.html"), /href="\/product\/reference\/" aria-current="true"/);
  assert.doesNotMatch(get("rules-extra/item.html"), /aria-current="true"/);
  assert.match(get("reference/index.html"), /href="\/product\/reference\/" aria-current="page"/);
  assert.match(get("reference/index.html"), /class="sl-pager"/);
});
