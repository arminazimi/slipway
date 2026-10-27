import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { test } from "node:test";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bundleAvailable, buildExample, exampleNames, root } from "./build.mjs";
import { validateSourcemap } from "./sourcemap.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

const page = { url: "/docs/intro.html", source: "_docs/intro.md" };

test("level 0, level 1, and an empty map are accepted", () => {
  const valid = [
    { version: 0, pages: [] },
    { version: 0, pages: [page, { url: "/2026/10/18/hello/", source: "_posts/2026-10-18-hello.md" }] },
    {
      version: 0,
      pages: [
        {
          ...page,
          sections: [
            { id: "install-npm-packages", level: 1, line: 6, text: "Install npm packages" },
            { id: "راستبهچپ", level: 2, line: 23, text: "راست‌به‌چپ" },
          ],
          links: [{ href: "../missing.md", line: 8 }],
        },
      ],
    },
  ];
  for (const data of valid) assert.deepEqual(validateSourcemap(data), { ok: true, errors: [] }, JSON.stringify(data));
});

test("a missing source, line 0, a wrong type, an unknown version, and a duplicate url are rejected", () => {
  const invalid = {
    "missing source": { version: 0, pages: [{ url: "/a/" }] },
    "line 0": { version: 0, pages: [{ ...page, links: [{ href: "/x/", line: 0 }] }] },
    "wrong type": { version: 0, pages: [{ ...page, sections: [{ id: "a", level: 1, line: "6", text: "A" }] }] },
    "unknown version": { version: 1, pages: [] },
    "duplicate url": { version: 0, pages: [page, { ...page, source: "_docs/other.md" }] },
  };
  for (const [name, data] of Object.entries(invalid)) {
    const { ok, errors } = validateSourcemap(data);
    assert.equal(ok, false, name);
    assert.ok(errors.length > 0, name);
  }
  assert.match(validateSourcemap(invalid["duplicate url"]).errors.join("\n"), /\/pages\/1\/url .* more than once/);
});

test("a source outside the site folder is rejected", () => {
  for (const source of ["/etc/passwd", "../secret.md", "_docs/../../x.md", "C:\\docs\\a.md"]) {
    assert.equal(validateSourcemap({ version: 0, pages: [{ url: "/a/", source }] }).ok, false, source);
  }
});

const built = (name, out) => JSON.parse(readFileSync(join(buildExample("gem", out, name), "sourcemap.json"), "utf8"));
const generated = (entry) => !/(\/|\.html)$/.test(entry.url) || /^assets\/|\.(xml|json|css|scss|js|md\.html)$/.test(entry.source);

test("every example but bare has a sourcemap.json stub on the sourcemap layout", () => {
  // bare proves a site works with only _config.yml and index.md, so it has no map (#166).
  for (const name of exampleNames().filter((n) => n !== "bare")) {
    assert.match(readFileSync(join(root, "examples", name, "sourcemap.json"), "utf8"), /^---\nlayout: sourcemap\npermalink: \/sourcemap\.json\n---/, name);
  }
});

test("the docs and blog examples map posts and pages to their real files, and list no generated file", { skip }, () => {
  const docs = built("docs", tmpDir("sourcemap-docs"));
  const blog = built("blog", tmpDir("sourcemap-blog"));
  for (const map of [docs, blog]) {
    assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
    assert.deepEqual(map.pages.filter(generated), []);
    assert.ok(map.pages.every((p) => !("sections" in p) && !("links" in p)), "level 0 has no lines");
  }
  assert.ok(docs.pages.some((p) => p.url === "/guide/install/" && p.source === "guide/install.md"));
  assert.ok(blog.pages.some((p) => p.url === "/2026/10/20/why-plain-markdown.html" && p.source === "_posts/2026-10-20-why-plain-markdown.md"));
  for (const url of ["/feed.xml", "/sitemap.xml", "/search.json", "/sourcemap.json"]) assert.ok(!blog.pages.some((p) => p.url === url), url);
});

test("Persian text and quotes in titles, urls, and file names keep the JSON valid", { skip }, () => {
  const site = mkdtempSync(join(realpathSync(tmpdir()), "slipway-sourcemap-"));
  try {
    cpSync(join(root, "examples", "persian"), site, { recursive: true });
    mkdirSync(join(site, "_docs"));
    writeFileSync(join(site, "_config.yml"), readFileSync(join(site, "_config.yml"), "utf8") + "collections:\n  docs:\n    output: true\n  notes:\n    output: false\n");
    writeFileSync(join(site, "_docs", 'say-"hi".md'), '---\ntitle: "\\"سلام\\" و \\\\ «نقل‌قول»"\nlayout: page\n---\nمتن\n');
    writeFileSync(join(site, "راهنما.md"), "---\ntitle: راهنمای \"تازه\"\nlayout: page\n---\nمتن\n");
    mkdirSync(join(site, "_notes"));
    writeFileSync(join(site, "_notes", "hidden.md"), "---\ntitle: Hidden\n---\nNot published.\n");
    const map = built(site, tmpDir("sourcemap-persian"));
    assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
    assert.ok(map.pages.some((p) => p.source === '_docs/say-"hi".md'), "a quote in a file name");
    assert.ok(map.pages.some((p) => p.source === "راهنما.md"), "a Persian file name");
    assert.ok(map.pages.some((p) => p.url === "/post-1/" && p.source === "_posts/2026-03-20-first.md"));
    assert.ok(!map.pages.some((p) => p.source.startsWith("_notes/")), "a collection with output: false is not listed");
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});
