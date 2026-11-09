import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { prose } from "../src/prose.ts";

const texts = (file) => prose(file).runs.map((run) => run.text);
const features = fileURLToPath(new URL("../../../fixtures/docs-site/features.md", import.meta.url));

test("plain prose is returned with its position", () => {
  const { lang, runs } = prose({ text: "One line.\nA second line.", lang: "en" });
  assert.equal(lang, "en");
  assert.deepEqual(runs, [
    { text: "One line.", line: 1, column: 1 },
    { text: "A second line.", line: 2, column: 1 },
  ]);
});

test("front matter is skipped and the line numbers after it are kept", () => {
  const file = ["---", "title: About", "lang: fa", "---", "First.", "Second."].join("\n");
  const { lang, runs } = prose({ text: file, lang: "en" });
  assert.equal(lang, "fa", "the front matter language wins");
  assert.deepEqual(runs, [
    { text: "First.", line: 5, column: 1 },
    { text: "Second.", line: 6, column: 1 },
  ]);
});

test("fenced code blocks are skipped in both markers", () => {
  const file = ["Before.", "```js", "const x = 1;", "```", "Between.", "~~~", "raw", "~~~", "After."].join("\n");
  assert.deepEqual(texts(file), ["Before.", "Between.", "After."]);
});

test("inline code is skipped and the text around it stays", () => {
  const runs = prose("Use `npm ci` first.").runs;
  assert.deepEqual(runs.map((run) => run.text), ["Use", "first."]);
  assert.equal(runs[1].column, 14, "the column points at the text after the span");
});

test("HTML tags and their attributes are not prose", () => {
  assert.deepEqual(texts('<span class="sl-note" dir="rtl">Note</span> text'), ["Note", "text"]);
  assert.deepEqual(texts("a <!-- hidden --> b"), ["a", "b"]);
});

test("link destinations and bare URLs are skipped, link text is kept", () => {
  assert.deepEqual(texts("See [the guide](/docs/guide.html) now."), ["See the guide", "now."]);
  assert.deepEqual(texts("A bare https://example.com/path?q=1 URL."), ["A bare", "URL."]);
  assert.deepEqual(texts("Mail me@example.com or www.example.org today."), ["Mail me@example.com or", "today."]);
});

test("images are skipped whole", () => {
  assert.deepEqual(texts("The ![logo](/assets/logo.svg) mark."), ["The", "mark."]);
});

test("Liquid tags are skipped and the text between them stays", () => {
  const file = ["{% for post in site.posts %}", "{{ post.title }}", "{% endfor %}"].join("\n");
  assert.deepEqual(prose({ text: file }).runs, []);
});

test("heading, quote, and list markers are not prose", () => {
  const file = ["## A heading", "> A quote", "- An item", "1. A numbered item"].join("\n");
  assert.deepEqual(texts(file), ["A heading", "A quote", "An item", "A numbered item"]);
});

test("columns count from the start of the original line", () => {
  const runs = prose("## [The guide](/config.html) is here").runs;
  assert.deepEqual(runs, [
    { text: "The guide", line: 1, column: 4 },
    { text: "is here", line: 1, column: 30 },
  ]);
});

test("a code span inside a link label is still code", () => {
  assert.deepEqual(texts("## [`slipway`](/config.html) is here"), ["is here"]);
});

test("directive fences are skipped and the body around them stays prose", () => {
  const file = [
    ":::callout{type=warning title=\"Read first\"}",
    "Watch out.",
    ":::",
    "::::tabs",
    "::::tab{label=\"macOS\"}",
    "Use Homebrew.",
    ":::",
    "::::",
    "::badge{label=new}",
  ].join("\n");
  assert.deepEqual(texts(file), ["Watch out.", "Use Homebrew."]);
});

test("a text directive's label is prose and its attributes are not", () => {
  const runs = prose("A :badge[New]{variant=tip} mark.").runs;
  assert.deepEqual(runs.map((run) => run.text), ["A New", "mark."]);
  const label = prose(":badge[New]{variant=tip}").runs;
  assert.deepEqual(label.map((run) => run.text), ["New"]);
  assert.equal(label[0].column, 7, "the label starts after the directive's name, like a link label");
});

test("a GitHub alert marker is skipped, but a marker with text stays a quote", () => {
  assert.deepEqual(texts("> [!NOTE]\n> Useful text."), ["Useful text."]);
  assert.deepEqual(texts("> [!NOTE] not an alert"), ["[!NOTE] not an alert"]);
});

test("a heading anchor and a task-list box are markers, not prose", () => {
  assert.deepEqual(texts("## A heading {#custom-id}"), ["A heading"]);
  assert.deepEqual(texts("- [ ] first\n- [x] second"), ["first", "second"]);
});

test("fixtures/docs-site prose skips the engine's directives, alerts, and attributes", () => {
  const { runs } = prose({ text: readFileSync(features, "utf8") });
  assert.ok(runs.length > 0, "the page has prose");
  for (const run of runs) {
    assert.doesNotMatch(run.text, /^:{2,}|\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]|\{#[^\s{}]+\}/, `${run.line}:${run.column}`);
  }
  assert.ok(runs.some((run) => run.text === "Credentials never appear in"), "the alert body is prose");
  assert.ok(runs.some((run) => run.text === "points an environment at an older artifact. It does not delete the newer one."), "the callout body is prose");
});
