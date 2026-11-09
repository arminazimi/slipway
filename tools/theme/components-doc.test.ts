import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { root } from "../root.ts";

const themeComponents = join(root, "packages/theme/components");
const componentDocs = join(root, "site/components");

/** Every component folder, sorted, which is the list the reference must cover. */
function componentNames(): string[] {
  return readdirSync(themeComponents, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** The page's front matter, parsed from its first `---` block. */
function frontMatter(file: string): Record<string, unknown> {
  const text = readFileSync(file, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  assert.ok(match, `${file} should start with a front matter block`);
  const parsed: unknown = parse(match[1] ?? "");
  assert.ok(parsed !== null && typeof parsed === "object" && !Array.isArray(parsed), `${file} should have a front matter object`);
  return parsed as Record<string, unknown>;
}

/** The front matter's `redirect_from`, as a list, whether it is written as one path or many. */
function redirectsOf(frontMatterValue: Record<string, unknown>): string[] {
  const value = frontMatterValue.redirect_from;
  if (typeof value === "string") return [value];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

test("every component folder has a reference page with syntax, options, and an example", () => {
  const names = componentNames();
  assert.ok(names.length > 0, "the theme should have component folders");

  for (const name of names) {
    const file = join(componentDocs, `${name}.md`);
    assert.ok(existsSync(file), `site/components/${name}.md should exist for components/${name}/`);

    const meta = frontMatter(file);
    assert.equal(meta.layout, "doc", `${name}.md should use the doc layout`);
    assert.equal(meta.permalink, `/components/${name}/`, `${name}.md should live at /components/${name}/`);
    assert.equal(typeof meta.title, "string", `${name}.md should have a title`);
    assert.ok((meta.title as string).length > 0, `${name}.md should have a non-empty title`);
    assert.equal(typeof meta.description, "string", `${name}.md should have a description`);

    const body = readFileSync(file, "utf8");
    for (const heading of ["## Syntax", "## Options", "## Example"]) {
      assert.match(body, new RegExp(`^${heading}$`, "m"), `${name}.md should have a "${heading}" section`);
    }
  }
});

test("the component index lists every reference page", () => {
  const index = readFileSync(join(componentDocs, "index.md"), "utf8");
  for (const name of componentNames()) {
    assert.match(index, new RegExp(`\\(./${name}/\\)`), `site/components/index.md should link to ${name}`);
  }
});

test("the old block URLs redirect to the pages that replaced them", () => {
  assert.equal(existsSync(join(root, "site/blocks")), false, "site/blocks should be removed");

  const redirects = new Set<string>();
  for (const entry of readdirSync(componentDocs)) {
    if (!entry.endsWith(".md")) continue;
    for (const path of redirectsOf(frontMatter(join(componentDocs, entry)))) redirects.add(path);
  }

  const oldBlocks = [
    "annotations",
    "audio",
    "badge",
    "callout",
    "cards",
    "chart",
    "citation",
    "code-group",
    "compare",
    "diff",
    "download",
    "embed",
    "endpoint",
    "figure",
    "file-tree",
    "gallery",
    "hero",
    "kbd",
    "logos",
    "people",
    "pricing",
    "pull-quote",
    "stats",
    "steps",
    "terminal",
    "testimonial",
    "timeline",
  ];

  assert.ok(redirects.has("/blocks/"), "the old /blocks/ index should redirect to /components/");
  for (const name of oldBlocks) {
    assert.ok(redirects.has(`/blocks/${name}/`), `the old /blocks/${name}/ should redirect to its replacement`);
  }
});
