// Tests for the `_config.yml` -> `slipway.yml` mapping (ADR 0024 rule 5): every surviving key lands
// in its new place with its comments, every dropped key is reported with a reason, and the result
// passes the engine's config schema. The last test converts every `_config.yml` under examples/ and
// starters/, which is the issue's "done when".
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { parseDocument } from "yaml";
import { migrateConfig, migrateConfigFile, type MigrateResult } from "./config.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));

/** The converted config as data, plus a guard that the text reparses cleanly. */
const converted = (source: string) => {
  const result = migrateConfig(source);
  assert.deepEqual(result.errors, [], `schema errors: ${result.errors.map((e) => e.note).join("; ")}`);
  const doc = parseDocument(result.yaml!);
  assert.deepEqual(doc.errors, [], "the converted text must parse");
  return doc.toJS();
};

const droppedKeys = (result: MigrateResult) => result.dropped.map((d) => d.key);
const droppedFor = (result: MigrateResult, key: string) => result.dropped.find((d) => d.key === key);
const resultFor = (source: string) => {
  const result = migrateConfig(source);
  assert.deepEqual(result.errors, [], `schema errors: ${result.errors.map((e) => e.note).join("; ")}`);
  return result;
};

test("baseurl becomes base, direction becomes dir", () => {
  const config = converted("baseurl: /evergreen\ndirection: rtl\n");
  assert.deepEqual(config, { base: "/evergreen", dir: "rtl" });
});

test("github becomes repository.url; slipway.source_dir becomes repository.dir", () => {
  const config = converted("github: https://github.com/arminazimi/evergreen\nslipway:\n  source_dir: docs\n");
  assert.deepEqual(config, { repository: { url: "https://github.com/arminazimi/evergreen", dir: "docs" } });
});

test("repository.dir without a repository.url stays, and the schema error names it", () => {
  const result = migrateConfig("slipway:\n  source_dir: docs\n");
  assert.match(result.yaml, /dir: docs/);
  assert.deepEqual(result.dropped, []);
  assert.deepEqual(result.errors.map((e) => e.key), ["repository.url"]);
});

test("a foreign theme becomes theme.name; the default theme is dropped with a note", () => {
  const config = converted("remote_theme: owner/other-theme\n");
  assert.deepEqual(config, { theme: { name: "owner/other-theme" } });
  const result = resultFor("theme: slipway-theme\nremote_theme: arminazimi/slipway\n");
  assert.deepEqual(parseDocument(result.yaml).toJS(), {});
  assert.deepEqual(droppedKeys(result), ["theme", "remote_theme"]);
  assert.match(droppedFor(result, "remote_theme").note, /default/);
});

test("slipway keys move to theme.options; languages and search hoist to the top level", () => {
  const config = converted(
    "slipway:\n  header:\n    sticky: true\n  logo:\n    light: a.svg\n  tokens:\n    accent: '#0a7'\n  languages:\n    - code: fa\n      name: فارسی\n      prefix: /fa\n  search:\n    text: 200\n");
  assert.deepEqual(config, {
    languages: [{ code: "fa", name: "فارسی", prefix: "/fa" }],
    search: { text: 200 },
    theme: { options: { header: { sticky: true }, logo: { light: "a.svg" }, tokens: { accent: "#0a7" } } },
  });
});

test("dropped keys are reported with reasons: author, plugins, and the slipway groups and sub-keys", () => {
  const result = resultFor(
    "author: someone\nplugins:\n  - jekyll-sitemap\npermalink: pretty\ncollections:\n  posts: {}\nfuture: true\nmarkdown: kramdown\nkramdown: {}\nhighlighter: rouge\nslipway:\n  comments:\n    repo: a/b\n  social:\n    - icon: github\n      url: https://github.com/a\n  tokens:\n    accent: '#0a7'\n    font_display: serif\n  persian:\n    digits: on\n    jalali: true\n  arabic:\n    hijri: true\n");
  const keys = droppedKeys(result);
  for (const key of ["author", "plugins", "permalink", "collections", "future", "markdown", "kramdown", "highlighter",
    "slipway.comments", "slipway.social", "slipway.tokens.font_display", "slipway.persian.jalali", "slipway.arabic.hijri"]) {
    assert.ok(keys.includes(key), `${key} is reported dropped`);
    assert.ok(droppedFor(result, key).note.length > 5, `${key} carries a reason`);
  }
  assert.match(droppedFor(result, "slipway.arabic").note, /no keys left/); // only hijri was in it
  const config = parseDocument(result.yaml).toJS();
  assert.deepEqual(config, { theme: { options: { tokens: { accent: "#0a7" }, persian: { digits: "on" } } } });
});

test("defaults entries lose the scope: path stays, type is dropped, values are untouched", () => {
  const config = converted(
    "defaults:\n  - scope:\n      path: docs\n      type: pages\n    values:\n      layout: doc\n      nav_order: 1\n  - scope:\n      path: ''\n    values:\n      lang: en\n");
  assert.deepEqual(config, {
    defaults: [{ path: "docs", values: { layout: "doc", nav_order: 1 } }, { path: "", values: { lang: "en" } }],
  });
});

test("comments travel with the keys they belong to", () => {
  const result = resultFor(
    "# the site\nlang: fa\n# where it lives\nbaseurl: /evergreen\nslipway:\n  # the mark\n  logo:\n    light: a.svg # light only\n");
  const yaml = result.yaml;
  assert.match(yaml, /# the site/);
  assert.match(yaml, /# where it lives/);
  assert.match(yaml, /base: \/evergreen/);
  assert.match(yaml, /# the mark/);
  assert.match(yaml, /light: a.svg # light only/);
  const config = parseDocument(yaml).toJS();
  assert.deepEqual(config, { lang: "fa", base: "/evergreen", theme: { options: { logo: { light: "a.svg" } } } });
});

test("comments inside a defaults values block survive the scope rewrite", () => {
  const result = resultFor("defaults:\n  - scope:\n      path: docs\n    values:\n      # the doc layout\n      layout: doc\n");
  assert.match(result.yaml, /# the doc layout/);
  assert.deepEqual(parseDocument(result.yaml).toJS(), { defaults: [{ path: "docs", values: { layout: "doc" } }] });
});

test("an unknown key is reported dropped, not silently lost", () => {
  const result = resultFor("future: true\nmystery: 1\n");
  assert.deepEqual(droppedKeys(result), ["future", "mystery"]);
  assert.match(droppedFor(result, "mystery").note, /ADR 0024/);
});

test("a parse failure or a non-mapping file reports an error, not a broken file", () => {
  const bad = migrateConfig("title: [unbalanced\n");
  assert.equal(bad.yaml, null);
  assert.ok(bad.errors.length >= 1);
  const list = migrateConfig("- a\n- b\n");
  assert.equal(list.yaml, null);
  assert.match(list.errors[0].note, /not a mapping/);
});

test("every _config.yml under examples/ and starters/ converts to a schema-valid file", () => {
  const configFiles = (dir) => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return configFiles(path);
      return entry.name === "_config.yml" ? [path] : [];
    });
  };
  const sites = [...configFiles(join(root, "examples")), ...configFiles(join(root, "starters"))];
  assert.ok(sites.length >= 1, "the examples this issue promises to migrate exist");
  for (const file of sites) {
    const result = migrateConfigFile(file);
    assert.deepEqual(result.errors, [], `${file}: ${result.errors.map((e) => e.note).join("; ")}`);
    const doc = parseDocument(result.yaml);
    assert.deepEqual(doc.errors, [], file);
  }
});

test("the product-docs example keeps its working keys and reports its Jekyll keys", () => {
  const result = migrateConfigFile(join(root, "examples/product-docs/_config.yml"));
  assert.deepEqual(result.errors, []);
  const config = parseDocument(result.yaml).toJS();
  assert.deepEqual(config, {
    title: "Beacon",
    description: "Documentation for the Beacon deploy CLI, in the shape of a real product's site.",
    lang: "en",
    url: "https://example.com",
    defaults: [{ path: "", values: { layout: "doc" } }],
  });
  assert.deepEqual(droppedKeys(result), ["remote_theme", "plugins"]);
  assert.match(result.yaml, /# yaml-language-server: \$schema=/); // the comment above a surviving key survives
});
