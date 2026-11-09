// Tests for the 0.2 -> 0.3 page conversion (issue #1183): layout names, the front-matter keys that changed,
// callout includes turned into directives, Liquid left and reported with its line, and the navigation check.
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkNavigation, mapLayout, migrateContent } from "./content.ts";

const frontmatter = (...lines: string[]) => ["---", ...lines, "---", ""].join("\n");

test("0.2 layout names map to engine layouts; the engine names are kept", () => {
  assert.equal(mapLayout("page"), "doc");
  assert.equal(mapLayout("default"), "doc");
  assert.equal(mapLayout("doc"), "doc");
  assert.equal(mapLayout("home"), "home");
  assert.equal(mapLayout("not-found"), "not-found");
  assert.equal(mapLayout("post"), undefined);
});

test("layout: page becomes layout: doc and says where it changed", () => {
  const source = frontmatter("title: Install", "layout: page");
  const result = migrateContent(source, "guide/install.md");
  assert.equal(result.text, frontmatter("title: Install", "layout: doc"));
  assert.deepEqual(result.changes, [{ file: "guide/install.md", line: 3, note: "layout page -> doc" }]);
  assert.deepEqual(result.reports, []);
});

test("layout names with quotes are read, and a page already on an engine layout is unchanged", () => {
  const quoted = migrateContent(frontmatter("layout: \"default\""));
  assert.equal(quoted.text, frontmatter("layout: doc"));
  const same = migrateContent(frontmatter("layout: doc", "title: x"));
  assert.equal(same.text, frontmatter("layout: doc", "title: x"));
  assert.deepEqual(same.changes, []);
});

test("a layout with no engine name is reported at its line and left in place", () => {
  const source = frontmatter("title: Post", "layout: post");
  const result = migrateContent(source, "blog/a.md");
  assert.equal(result.text, source);
  assert.deepEqual(result.reports, [
    { file: "blog/a.md", line: 3, note: "layout post has no engine layout yet; the build fails on an unknown layout until it is renamed or removed" },
  ]);
});

test("nav_order and direction are renamed to order and dir", () => {
  const result = migrateContent(frontmatter("nav_order: 3", "direction: rtl"));
  assert.equal(result.text, frontmatter("order: 3", "dir: rtl"));
  assert.deepEqual(result.changes.map((c) => c.note), ["nav_order -> order", "direction -> dir"]);
});

test("nav_order is left in place when order is already set, and reported", () => {
  const source = frontmatter("nav_order: 3", "order: 1");
  const result = migrateContent(source);
  assert.equal(result.text, source);
  assert.deepEqual(result.reports.map((r) => r.note), ["nav_order and order are both set; nav_order is left in place"]);
});

test("a standalone callout include becomes a callout directive", () => {
  const source = [
    "Intro.",
    "",
    '{% include blocks/callout.html type="tip" title="Tip" body="Keep it short." %}',
    "",
    "More.",
    "",
  ].join("\n");
  const result = migrateContent(source, "a.md");
  assert.equal(
    result.text,
    ['Intro.', '', ':::callout{type="tip" title="Tip"}', 'Keep it short.', ':::', '', 'More.', ''].join("\n"),
  );
  assert.deepEqual(result.changes, [{ file: "a.md", line: 3, note: "callout include -> :::callout directive" }]);
  assert.deepEqual(result.reports, []);
});

test("danger becomes caution, and the include's indentation is kept on every row", () => {
  const result = migrateContent('  {% include blocks/callout.html type="danger" body="Careful." %}\n');
  assert.equal(result.text, '  :::callout{type="caution"}\n  Careful.\n  :::\n');
});

test("a callout whose body is a Liquid variable is left in place and reported with its line", () => {
  const source = frontmatter("title: x") + "Text.\n\n{% include blocks/callout.html type=\"note\" body=page.note_body %}\n";
  const result = migrateContent(source, "b.md");
  assert.equal(result.text, source);
  assert.equal(result.reports.length, 1);
  assert.equal(result.reports[0]!.line, 6);
  assert.match(result.reports[0]!.note, /not a literal string/);
});

test("a callout inside a line of text is not a block and is left in place", () => {
  const source = 'Text {% include blocks/callout.html body="x" %} more\n';
  const result = migrateContent(source);
  assert.equal(result.text, source);
  assert.match(result.reports[0]!.note, /shares its line with other text/);
});

test("Liquid inside fenced code, inline code, and raw blocks is an example: not converted, not reported", () => {
  const source = [
    "Use the include like this:",
    "",
    '```liquid',
    '{% include blocks/callout.html type="tip" body="x" %}',
    '```',
    "",
    "Or inline: `{{ page.title }}`.",
    "",
    "{% raw %}{% include blocks/callout.html body=page.x %}{% endraw %}",
    "",
  ].join("\n");
  const result = migrateContent(source);
  assert.equal(result.text, source);
  assert.deepEqual(result.changes, []);
  assert.deepEqual(result.reports, []);
});

test("other Liquid tags and outputs are reported with their file and line", () => {
  const source = frontmatter("title: x") + "\n{% include blocks/badge.html label=\"new\" %}\n{{ site.title }}\n";
  const result = migrateContent(source, "c.md");
  assert.equal(result.text, source);
  assert.deepEqual(
    result.reports.map((r) => [r.file, r.line]),
    [["c.md", 5], ["c.md", 6]],
  );
  assert.match(result.reports[0]!.note, /include blocks\/badge\.html/);
  assert.match(result.reports[1]!.note, /\{\{ site\.title \}\}/);
});

test("a page without front matter converts its body only", () => {
  const result = migrateContent('{% include blocks/callout.html type="warning" body="Mind the gap." %}\n');
  assert.equal(result.text, ':::callout{type="warning"}\nMind the gap.\n:::\n');
  assert.equal(result.changes[0]!.line, 1);
});

test("a valid navigation file has no problems", () => {
  const source = [
    "main:",
    "  - title: Docs",
    "    url: /docs/",
    "docs:",
    "  - title: Install",
    "    children:",
    "      - title: Quick start",
    "        url: https://example.com/start",
    "",
  ].join("\n");
  assert.deepEqual(checkNavigation(source, "_data/navigation.yml"), []);
});

test("a navigation URL without a leading slash is reported at its line", () => {
  const source = "main:\n  - title: Docs\n    url: docs/x\n";
  const problems = checkNavigation(source, "_data/navigation.yml");
  assert.equal(problems.length, 1);
  assert.equal(problems[0]!.file, "_data/navigation.yml");
  assert.equal(problems[0]!.line, 3);
});

test("an unknown top-level navigation key is reported at line 1", () => {
  const problems = checkNavigation("sidebar:\n  - title: A\n    url: /a/\n", "_data/navigation.yml");
  assert.ok(problems.length > 0);
  assert.equal(problems[0]!.line, 1);
});
