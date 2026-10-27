import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateSourcemap } from "./sourcemap.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const modes = join(root, "docs/modes.md");
const text = readFileSync(modes, "utf8");

test("docs/modes.md describes both modes and the feature table", () => {
  assert.match(text, /\*\*Classic\*\*/);
  assert.match(text, /\*\*Actions mode\*\*/);
  assert.match(text, /## What each feature needs/);
});

test("every relative link in docs/modes.md points at a file that exists", () => {
  const links = [...text.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map((m) => m[1]).filter((href) => !/^[a-z]+:/.test(href));
  assert.ok(links.length > 0);
  for (const href of links) assert.ok(existsSync(resolve(dirname(modes), href)), `${href} does not exist`);
});

test("the README links to docs/modes.md", () => {
  assert.match(readFileSync(join(root, "README.md"), "utf8"), /\(docs\/modes\.md\)/);
});

// docs/source-maps.md: its example and both templates must produce maps the schema accepts.
const sourceMapsDoc = readFileSync(join(root, "docs/source-maps.md"), "utf8");
const block = (lang) => {
  const found = sourceMapsDoc.match(new RegExp("```" + lang + "\\n([\\s\\S]*?)```"));
  assert.ok(found, `docs/source-maps.md has a ${lang} block`);
  return found[1];
};
const hugo = process.env.HUGO ?? "hugo";
const sourceMapSite = (files) => {
  const site = mkdtempSync(join(realpathSync(tmpdir()), "slipway-docs-sourcemap-"));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(site, path)), { recursive: true });
    writeFileSync(join(site, path), body);
  }
  return site;
};

test("docs/source-maps.md explains the three modes in one table", () => {
  for (const mode of ["Classic GitHub Pages", "Classic Pages with a committed file", "Actions mode"]) {
    assert.match(sourceMapsDoc, new RegExp(`^\\| ${mode} \\|`, "m"), mode);
  }
});

test("the example JSON in docs/source-maps.md validates against the schema", () => {
  const map = JSON.parse(block("json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.ok(map.pages.some((p) => !("sections" in p)) && map.pages.some((p) => "sections" in p), "shows level 0 and a level with lines");
});

test("the README, docs/modes.md, and the spec link to docs/source-maps.md", () => {
  assert.match(readFileSync(join(root, "README.md"), "utf8"), /\(docs\/source-maps\.md\)/);
  assert.match(text, /\(source-maps\.md\)/);
  assert.match(readFileSync(join(root, "spec/sourcemap/v0.md"), "utf8"), /\(\.\.\/\.\.\/docs\/source-maps\.md\)/);
});

test("the Liquid template in docs/source-maps.md writes a valid map", { skip: bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem" }, () => {
  const site = sourceMapSite({
    "_config.yml": 'title: Other theme\ncollections:\n  docs:\n    output: true\n  notes:\n    output: false\n',
    "sourcemap.json": block("liquid"),
    "index.md": "---\ntitle: Home\n---\nHello\n",
    "راهنما.md": '---\ntitle: "راهنمای \\"تازه\\""\n---\nمتن\n',
    "_posts/2026-10-20-hello.md": "---\ntitle: Hello\n---\nA post.\n",
    '_docs/say-"hi".md': "---\ntitle: Hi\n---\nA doc.\n",
    "_notes/hidden.md": "---\ntitle: Hidden\n---\nNot published.\n",
  });
  const out = tmpDir("docs-sourcemap-liquid");
  try {
    const map = JSON.parse(readFileSync(join(buildExample("gem", out, site), "sourcemap.json"), "utf8"));
    assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
    const sources = map.pages.map((p) => p.source).sort();
    assert.deepEqual(sources, ['_docs/say-"hi".md', "_posts/2026-10-20-hello.md", "index.md", "راهنما.md"].sort());
  } finally {
    rmSync(site, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test("the Hugo template in docs/source-maps.md writes a valid map", { skip: spawnSync(hugo, ["version"]).status === 0 ? false : "install Hugo (or set HUGO) to run it" }, () => {
  const site = sourceMapSite({
    "hugo.toml": 'baseURL = "https://example.org/"\ntitle = "Other theme"\n\n' + block("toml"),
    "layouts/index.sourcemap.json": block("go-html-template"),
    "layouts/_default/single.html": "{{ .Content }}",
    "layouts/_default/list.html": "{{ .Content }}",
    "content/_index.md": "---\ntitle: Home\n---\nHello\n",
    "content/about.md": "---\ntitle: About\n---\nAbout.\n",
    "content/posts/hello.md": '---\ntitle: Hello\ntags: ["a"]\n---\nA post.\n',
  });
  try {
    const result = spawnSync(hugo, ["--quiet", "--source", site, "--destination", join(site, "public")], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const map = JSON.parse(readFileSync(join(site, "public/sourcemap.json"), "utf8"));
    assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
    assert.deepEqual(
      map.pages.map((p) => `${p.url} ${p.source}`).sort(),
      ["/ content/_index.md", "/about/ content/about.md", "/posts/hello/ content/posts/hello.md"],
    );
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});
