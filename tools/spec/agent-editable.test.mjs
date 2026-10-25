import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

const root = new URL("../../", import.meta.url);
const spec = readFileSync(new URL("spec/agent-editable/0.1.md", root), "utf8");
const schema = JSON.parse(readFileSync(new URL("schema/content-schemas.schema.json", root), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

// Code blocks and blockquotes are examples; everything else is normative.
function normative(text) {
  return text
    .replace(/^```[\s\S]*?^```$/gm, "")
    .split("\n")
    .filter((line) => !line.startsWith(">"))
    .join("\n");
}

function requirements(text) {
  const parts = text.split(/^#### /m).slice(1);
  return parts.map((part) => {
    const [heading, ...rest] = part.split("\n");
    const body = rest.join("\n").split(/^#{2,3} /m)[0];
    const match = heading.match(/^(\d+)\.(\d+)\. `(ae\.[a-z0-9-]+\.[a-z0-9-]+)`$/);
    return { heading, match, body };
  });
}

test("every requirement has a number, an id, a keyword, a level, a scope, a rationale, and a check", () => {
  const reqs = requirements(spec);
  assert.ok(reqs.length >= 20, `found ${reqs.length} requirements`);
  const ids = new Set();
  for (const { heading, match, body } of reqs) {
    assert.ok(match, `heading "${heading}" is "<section>.<n>. \`ae.<item>.<name>\`"`);
    const id = match[3];
    assert.ok(!ids.has(id), `${id} is unique`);
    ids.add(id);
    assert.match(body, /^\*\*(MUST|SHOULD) · L[0-3] · (source|output|both)\*\*$/m, `${id} has keyword, level, and scope`);
    assert.match(body, /^- \*Rationale:\* \S/m, `${id} has a rationale`);
    assert.match(body, /^- \*Check:\* \S/m, `${id} has a check`);
    const keyword = body.match(/^\*\*(MUST|SHOULD)/m)[1];
    assert.ok(normative(body).includes(keyword), `${id} uses ${keyword} in its text`);
  }
});

test("requirements are numbered in order within each section", () => {
  let last = [0, 0];
  for (const { match } of requirements(spec)) {
    const [section, n] = [Number(match[1]), Number(match[2])];
    assert.ok(section === last[0] ? n === last[1] + 1 : section === last[0] + 1 && n === 1, `${section}.${n} follows ${last.join(".")}`);
    last = [section, n];
  }
});

test("the normative text never mentions one generator or template language", () => {
  assert.doesNotMatch(normative(spec), /jekyll|liquid/i);
});

test("the content-schema index schema accepts the spec's example and rejects bad entries", () => {
  const example = JSON.parse(spec.match(/```json\n(\{\n  "version": "0\.1"[\s\S]*?)```/)[1]);
  assert.ok(validate(example), JSON.stringify(validate.errors));
  const entry = { files: ["posts/**/*.md"], target: "front-matter", schema: "schema/post.schema.json" };
  assert.ok(validate({ version: "0.1", schemas: [{ ...entry, schema: "https://example.com/post.json" }] }));
  const invalid = {
    "unknown version": { version: "1.0", schemas: [] },
    "missing target": { version: "0.1", schemas: [{ files: entry.files, schema: entry.schema }] },
    "empty files": { version: "0.1", schemas: [{ ...entry, files: [] }] },
    "absolute glob": { version: "0.1", schemas: [{ ...entry, files: ["/posts/*.md"] }] },
    "schema outside the source folder": { version: "0.1", schemas: [{ ...entry, schema: "../schema.json" }] },
    "http schema": { version: "0.1", schemas: [{ ...entry, schema: "http://example.com/s.json" }] },
    "when on a file target": { version: "0.1", schemas: [{ ...entry, target: "file", when: { layout: "post" } }] },
    "unknown field": { version: "0.1", schemas: [{ ...entry, extra: true }] },
  };
  for (const [name, data] of Object.entries(invalid)) assert.equal(validate(data), false, name);
});
