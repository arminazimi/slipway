import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample, exampleNames } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("the llms layouts are plain Liquid and share one rule for which pages they list", () => {
  for (const layout of ["llms", "llms-full"]) {
    const source = read(`_layouts/${layout}.html`);
    assert.match(source, /include llms-item\.html item=item/);
    assert.doesNotMatch(source, /\{%-?\s*(seo|feed_meta|jekyll_)/);
  }
});

test("every example except bare publishes llms.txt and llms-full.txt", () => {
  for (const name of exampleNames().filter((n) => n !== "bare")) {
    for (const [file, layout] of [["llms.txt", "llms"], ["llms-full.txt", "llms-full"]]) {
      const path = join(root, "examples", name, file);
      assert.ok(existsSync(path), `examples/${name}/${file} is missing`);
      const source = readFileSync(path, "utf8");
      assert.match(source, new RegExp(`^layout: ${layout}$`, "m"));
      assert.match(source, new RegExp(`^permalink: /${file.replace(".", "\\.")}$`, "m"));
    }
  }
});

test("llms.txt lists each page with its description in sections, and llms-full.txt holds their text", { skip }, () => {
  const out = buildExample("gem", tmpDir("llms-site"));
  const get = (p) => readFileSync(join(out, p), "utf8");
  const index = get("llms.txt");
  assert.match(index, /^# Slipway minimal\n\n> The smallest site that uses every Slipway layout\.\n/);
  assert.match(index, /The full text of every page is in \[llms-full\.txt\]\(https?:\/\/[^)]+\/llms-full\.txt\)\./);
  const sections = [...index.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(sections, ["Docs", "Posts", "Pages"]);
  assert.match(index, /^- \[Layouts\]\(https?:\/\/[^)]+\/docs\/layouts\/\): The layouts Slipway ships\.$/m);
  assert.match(index, /^- \[Hello world\]\(https?:\/\/[^)]+\/2026\/10\/18\/hello-world\.html\): The first post\.$/m);
  assert.match(index, /^- \[سلام اسلیپ‌وی\]\(https?:\/\/[^)]+\/fa\/\)/m);
  // Generated files and the 404 page are not pages to read.
  assert.doesNotMatch(index, /feed\.xml|sitemap\.xml|search\.json|sourcemap\.json|404|llms\.txt/);
  for (const line of index.split("\n").filter((l) => l.startsWith("- "))) assert.match(line, /^- \[[^\]]+\]\([^)]+\)(: .+)?$/);

  const full = get("llms-full.txt");
  assert.match(full, /^# Slipway minimal\n/);
  assert.equal([...full.matchAll(/^Source: /gm)].length, [...index.matchAll(/^- \[/gm)].length);
  assert.match(full, /# Layouts\n\nSource: https?:\/\/[^\n]+\/docs\/layouts\/\n\nThe layouts Slipway ships\.\n\n## Base and home\n\nThe base layout holds the landmarks\./);
  assert.match(full, /```\n\/\/ Copy this line\nconst layout = "doc";\n```/);
  assert.match(full, /## بخش اول\n\nمتنی برای آزمایش تاریخ و ارقام فارسی\./);
  assert.doesNotMatch(full, /<\/?(p|h2|pre|code|span|div)\b|&(lt|gt|amp|quot|rsquo);/);
  assert.doesNotMatch(full, /\n\n\n/);
});
