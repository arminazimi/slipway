import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  formatProblem,
  frontMatter,
  layoutSchemas,
  schemaDir,
  schemaFor,
  validateFile,
  validateFrontMatter,
  validatePaths,
} from "./front-matter.mjs";
import { root } from "./tokens.mjs";

const base = JSON.parse(readFileSync(join(schemaDir, "base.schema.json"), "utf8"));

test("every Markdown page in the examples matches its schema", () => {
  assert.deepEqual(validatePaths().map(formatProblem), []);
});

test("the schema comes from layout, then the collection folder, then page", () => {
  assert.equal(schemaFor({ layout: "post" }, "about.md"), "post");
  assert.equal(schemaFor({ layout: "tags" }), "page");
  assert.equal(schemaFor({ layout: "my-custom" }), "base");
  assert.equal(schemaFor({}, "examples/blog/_posts/2026-10-20-x.md"), "post");
  assert.equal(schemaFor({}, "site/_docs/install.md"), "doc");
  assert.equal(schemaFor({}, "site/about.md"), "page");
});

test("invalid samples report the key and the allowed values", () => {
  const cases = [
    [{ description: "no title" }, "title", /is required/, []],
    [{ title: "" }, "title", /fewer than 1/, ["a non-empty string"]],
    [{ title: "x", dir: "left" }, "dir", /allowed values/, ["ltr", "rtl"]],
    [{ title: "x", direction: "up" }, "direction", /allowed values/, ["ltr", "rtl"]],
    [{ title: "x", lang: "Persian" }, "lang", /pattern/, [base.properties.lang.description]],
    [{ title: "x", layout: "post", date: "18 Oct 2026" }, "date", /pattern/, [base.$defs.date.description]],
    [{ title: "x", tags: { a: 1 } }, "tags", /list or a string/, ["a list", "a space-separated string"]],
    [{ title: "x", published: "no" }, "published", /boolean/, ["a boolean"]],
    [{ title: "x", nav_order: "first" }, "nav_order", /number/, ["a number"]],
    [{ title: "x", permalink: "docs/" }, "permalink", /pattern/, [base.properties.permalink.description]],
    [{ title: "x", translation_key: "" }, "translation_key", /fewer than 1/, ["a non-empty string"]],
    [{ title: "x", layout: "home", cta_text: "Go" }, "cta_url", /required with cta_text/, []],
    [{ title: "x", layout: "home", cta_text: "Go", cta_url: "javascript:alert(1)" }, "cta_url", /pattern/, [base.$defs.url.description]],
  ];
  for (const [data, key, message, allowed] of cases) {
    const problems = validateFrontMatter(data, "sample.md");
    assert.equal(problems.length, 1, JSON.stringify({ data, problems }));
    const [problem] = problems;
    assert.equal(problem.file, "sample.md");
    assert.equal(problem.key, key, JSON.stringify(data));
    assert.match(problem.message, message, JSON.stringify(data));
    assert.deepEqual(problem.allowed, allowed, JSON.stringify(data));
  }
});

test("unknown keys, Jekyll tag strings, and dates with a time are accepted", () => {
  const ok = [
    { title: "x", my_key: { anything: true } },
    { title: "x", layout: "post", tags: "one two", categories: ["a", 2026], date: "2026-10-18 09:30:00 +0330" },
    { title: "x", permalink: "pretty" },
    { title: "x", lang: "pt-BR", dir: "rtl", sitemap: false, search: false, published: true, nav_order: 2.5 },
    { title: "x", layout: "home", cta_text: "Go", cta_url: "https://example.com/" },
  ];
  for (const data of ok) assert.deepEqual(validateFrontMatter(data), [], JSON.stringify(data));
});

test("a broken file is reported with its path, key, and allowed values", () => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-fm-"));
  mkdirSync(join(dir, "_posts"));
  writeFileSync(join(dir, "_posts/2026-10-18-bad.md"), "---\ntitle: Bad\ndir: sideways\n---\nText\n");
  writeFileSync(join(dir, "broken.md"), "---\ntitle: [unclosed\n---\n");
  writeFileSync(join(dir, "plain.md"), "No front matter here.\n");
  writeFileSync(join(dir, "README.md"), "---\nnot: a page\n---\n");
  const problems = validatePaths([dir], dir).map(formatProblem).sort();
  assert.equal(problems.length, 2, problems.join("\n"));
  assert.equal(problems[0], "_posts/2026-10-18-bad.md: dir must be equal to one of the allowed values (allowed: ltr, rtl)");
  assert.match(problems[1], /^broken\.md: \/ YAML does not parse/);
  assert.deepEqual(validateFile(join(dir, "plain.md"), dir), []);
});

test("front matter is split off the body", () => {
  assert.equal(frontMatter("---\ntitle: x\n---\nbody"), "title: x");
  assert.equal(frontMatter("---\n---\nbody"), "");
  assert.equal(frontMatter("body"), null);
});

test("the shared keys match ADR 0003 and every field is in the public API ADR", () => {
  const adr3 = readFileSync(join(root, "docs/adr/0003-content-model.md"), "utf8");
  const line = adr3.split("\n").find((l) => l.startsWith("2. **Front matter is YAML"));
  const keys = [...line.matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);
  assert.ok(keys.length >= 10, "ADR 0003 lists the front matter keys");
  for (const key of keys) assert.ok(key in base.properties, `${key} from ADR 0003 is in base.schema.json`);
  assert.deepEqual(base.required, ["title"], "ADR 0003 makes only title required");
  assert.equal(base.additionalProperties, true, "ADR 0003 keeps unknown keys");

  const adr12 = readFileSync(join(root, "docs/adr/0012-public-api.md"), "utf8");
  const section = adr12.split("### Front matter")[1].split("### ")[0];
  const fields = new Set(
    section.split("\n").filter((l) => l.startsWith("| `")).flatMap((l) => [...l.split("|")[1].matchAll(/`([a-z_]+)/g)].map((m) => m[1])),
  );
  const schemas = ["base", ...new Set(Object.values(layoutSchemas))];
  for (const name of schemas) {
    const schema = JSON.parse(readFileSync(join(schemaDir, `${name}.schema.json`), "utf8"));
    for (const key of Object.keys(schema.properties ?? {})) assert.ok(fields.has(key), `${key} (${name}) is in ADR 0012`);
  }
});

test("the README lists every layout schema", () => {
  const readme = readFileSync(join(schemaDir, "README.md"), "utf8");
  for (const [layout, schema] of Object.entries(layoutSchemas)) {
    assert.match(readme, new RegExp("`" + layout + "`"), layout);
    assert.match(readme, new RegExp(`${schema}\\.schema\\.json`), schema);
  }
});
