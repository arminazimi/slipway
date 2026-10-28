import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { tmpDir } from "./tmp.mjs";

const skip = !bundleAvailable();
const cases = [
  ["explicit", "slipway:\n  source_dir: docs\ngithub:\n  source:\n    path: /other\n", "docs/"],
  ["metadata", "github:\n  source:\n    path: /docs\n", "docs/"],
  ["normalized", "slipway:\n  source_dir: ./docs/api/\n", "docs/api/"],
  ["root", "", ""],
  ["metadata-root", "github:\n  source:\n    path: /\n", ""],
  ["explicit-root", "slipway:\n  source_dir: ''\ngithub:\n  source:\n    path: /docs\n", ""],
];

for (const [name, config, prefix] of cases) {
  test(`section edit paths use the repository source prefix (${name})`, { skip }, () => {
    const site = tmpDir(`subfolder-${name}-source`);
    mkdirSync(site, { recursive: true });
    writeFileSync(join(site, "_config.yml"), `title: Subfolder\ntheme: slipway-theme\n${config}`);
    writeFileSync(join(site, "intro.md"), "---\nlayout: doc\ntitle: Intro\nslipway_sections:\n  - id: exact\n    line: 12\n---\n\n## Exact\n\nText.\n\n### Fallback\n\nMore text.\n");
    writeFileSync(join(site, "sourcemap.json"), "---\nlayout: sourcemap\npermalink: /sourcemap.json\n---\n");
    const out = buildExample("gem", tmpDir(`subfolder-${name}-out`), site);
    const html = readFileSync(join(out, "intro.html"), "utf8");
    const sources = [...html.matchAll(/<h[23]\b[^>]*data-source="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(sources, [`${prefix}intro.md:12`, `${prefix}intro.md`]);
    const map = JSON.parse(readFileSync(join(out, "sourcemap.json"), "utf8"));
    assert.equal(map.pages.find((page) => page.url === "/intro.html").source, "intro.md");
  });
}
