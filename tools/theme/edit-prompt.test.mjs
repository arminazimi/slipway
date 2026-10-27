import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import vm from "node:vm";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const script = read("assets/js/edit-prompt.js");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const work = mkdtempSync(join(tmpdir(), "slipway-edit-"));
after(() => rmSync(work, { recursive: true, force: true }));

function run() {
  const context = {};
  context.globalThis = context;
  vm.runInNewContext(script, context);
  return context.slipwayEdit;
}

/** Each h2 and h3 of the built HTML as { tag, id, source }. */
const headings = (html) =>
  [...html.matchAll(/<(h[23])\b([^>]*)>/g)].map(([, tag, attrs]) => ({
    tag,
    id: attrs.match(/\bid="([^"]*)"/)?.[1],
    source: attrs.match(/\bdata-source="([^"]*)"/)?.[1],
  }));

test("the prompt names the file and line and quotes a Persian section on one line", () => {
  const { build } = run();
  const fa = "فایل {source} را ویرایش کن. متن فعلی: «{text}». تغییر:";
  const text = "راست‌به‌چپ و ZWNJ\n\n  این بخش  دربارهٔ $& و نیم‌فاصله است.\n";
  assert.equal(
    build(fa, "_docs/headings.md:12", text),
    "فایل _docs/headings.md:12 را ویرایش کن. متن فعلی: «راست‌به‌چپ و ZWNJ این بخش دربارهٔ $& و نیم‌فاصله است.». تغییر: ",
  );
  assert.equal(build('Edit {source}. Current text: "{text}". Change:', "about.md", "Hi"), 'Edit about.md. Current text: "Hi". Change: ');
});

test("the script is under 1.2 KB, deferred, and adds the button itself", () => {
  assert.ok(Buffer.byteLength(script) < 1.2 * 1024, `${Buffer.byteLength(script)} bytes`);
  assert.match(read("_includes/head.html"), /edit-prompt\.js' \| relative_url \}\}" defer/);
  assert.match(script, /createElement\("button"\)/);
  assert.doesNotMatch(script, /fetch|XMLHttpRequest|sendBeacon/);
});

test("the doc and post layouts mark their sections and carry the translated prompt", () => {
  for (const layout of ["_layouts/doc.html", "_layouts/post.html"]) {
    const html = read(layout);
    assert.match(html, /\{% include edit-sources\.html html=content %\}/, layout);
    assert.match(html, /capture sl_edit_label %\}\{% include t\.html key='edit_label' %\}/, layout);
    assert.match(html, /capture sl_edit_prompt %\}\{% include t\.html key='edit_prompt' %\}/, layout);
    assert.match(html, /data-edit-label="\{\{ sl_edit_label \| escape \}\}" data-edit-prompt="\{\{ sl_edit_prompt \| escape \}\}"/, layout);
  }
  const fa = read("_includes/i18n/fa.html");
  const en = read("_includes/i18n/en.html");
  for (const part of [fa, en]) assert.match(part, /when 'edit_prompt' -%\}[^\n]*\{source\}[^\n]*\{text\}/);
});

test("the button is not printed", () => {
  assert.match(read("assets/css/print.css"), /\.sl-edit \{\s*display: none;/);
});

test("classic mode: every section of a built doc and post page names its file, and no button is in the HTML", { skip }, () => {
  const docs = buildExample("gem", join(work, "docs"), "docs");
  const page = readFileSync(join(docs, "guide/install/index.html"), "utf8");
  const found = headings(page.slice(page.indexOf("<article")));
  assert.ok(found.length >= 2);
  for (const h of found) assert.equal(h.source, "guide/install.md", `${h.tag}#${h.id}`);
  assert.doesNotMatch(page, /<button[^>]*sl-edit/);

  const blog = buildExample("gem", join(work, "blog"), "blog");
  const posts = readdirSync(join(root, "examples/blog/_posts"));
  const marked = readdirSync(blog, { recursive: true })
    .filter((f) => f.endsWith(".html"))
    .flatMap((f) => headings(readFileSync(join(blog, f), "utf8")))
    .filter((h) => h.source);
  assert.ok(marked.length >= 1, "a post has a section marked with its file");
  for (const h of marked) assert.ok(posts.some((p) => h.source === `_posts/${p}`), h.source);
});

test("Actions mode: every section names its file and its line from the source map", { skip }, () => {
  const site = join(work, "actions-site");
  cpSync(join(root, "tools/theme/fixtures/sourcemap-site"), site, { recursive: true });
  cpSync(join(root, "_plugins"), join(site, "_plugins"), { recursive: true });
  const config = readFileSync(join(site, "_config.yml"), "utf8");
  writeFileSync(join(site, "_config.yml"), `${config}defaults:\n  - scope: { type: docs }\n    values: { layout: doc }\n  - scope: { type: posts }\n    values: { layout: post }\n`);
  const out = join(work, "actions");
  // As in an Actions build: not safe, _plugins loaded (tools/sourcemap/sourcemap.test.mjs).
  const result = spawnSync("bundle", ["exec", "jekyll", "build", "--source", site, "--destination", out, "--baseurl", ""], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PAGES_REPO_NWO: "arminazimi/slipway", LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8", JEKYLL_NO_BUNDLER_REQUIRE: "1" },
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  const map = JSON.parse(readFileSync(join(out, "sourcemap.json"), "utf8"));
  const entry = map.pages.find((p) => p.source === "_docs/headings.md");
  const page = readFileSync(join(out, entry.url.replace(/\/$/, "/index.html").replace(/^\//, "")), "utf8");
  const found = headings(page.slice(page.indexOf("<article")));
  const expected = entry.sections.filter((s) => s.level === 2 || s.level === 3);
  assert.ok(expected.length >= 2);
  assert.deepEqual(
    found.map((h) => [h.id, h.source]),
    expected.map((s) => [s.id, `_docs/headings.md:${s.line}`]),
  );
});
