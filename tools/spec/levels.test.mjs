import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const spec = read("spec/agent-editable/0.1.md");
const levelsDoc = read("spec/agent-editable/levels.md");
const tests = JSON.parse(read("spec/agent-editable/tests.json"));
const schema = JSON.parse(read("schema/conformance-tests.schema.json"));
const LEVELS = ["L0", "L1", "L2", "L3"];

// Requirements as the spec states them: heading, keyword line, check.
function requirements(text) {
  return text.split(/^#### /m).slice(1).map((part) => {
    const [heading, ...rest] = part.split("\n");
    const body = rest.join("\n").split(/^#{2,3} /m)[0];
    const [, section, n, id] = heading.match(/^(\d+)\.(\d+)\. `(ae\.[a-z0-9-]+\.[a-z0-9-]+)`$/);
    const [, keyword, level, scope] = body.match(/^\*\*(MUST|SHOULD) · (L[0-3]) · (source|output|both)\*\*$/m);
    const check = body.match(/^- \*Check:\* (.*)$/m)[1];
    return { id, section, n, keyword, level, scope, review: check.startsWith("review."), network: /network option/.test(check) };
  });
}

const reqs = requirements(spec);

test("tests.json validates against its schema", () => {
  const validate = new Ajv2020({ allErrors: true }).compile(schema);
  assert.ok(validate(tests), JSON.stringify(validate.errors));
  assert.equal(tests.version, spec.match(/^# .*, version (\S+)$/m)[1]);
  assert.equal(validate({ ...tests, tests: [{ ...tests.tests[0], level: "L4" }] }), false, "no level beyond L3");
});

test("tests.json lists every requirement of the spec, in order, and nothing else", () => {
  assert.deepEqual(tests.tests.map((t) => t.id), reqs.map((r) => r.id));
});

test("each test has the spec's level, keyword, scope, and kind of check", () => {
  const byId = new Map(tests.tests.map((t) => [t.id, t]));
  for (const r of reqs) {
    const t = byId.get(r.id);
    assert.equal(t.level, r.level, `${r.id} level`);
    assert.equal(t.keyword, r.keyword, `${r.id} keyword`);
    assert.equal(t.scope, r.scope, `${r.id} scope`);
    assert.equal(t.how, r.review ? "review" : "automated", `${r.id} how`);
    assert.equal(t.network === "opt-in", r.network, `${r.id} network`);
  }
});

test("each level is a strict superset of the one below", () => {
  for (const level of LEVELS) {
    const musts = tests.tests.filter((t) => t.level === level && t.keyword === "MUST" && t.how === "automated");
    assert.ok(musts.length > 0, `${level} adds at least one automated MUST`);
  }
});

test("levels.md lists each test under its level, with its keyword and scope", () => {
  const sections = levelsDoc.split(/^### /m).slice(1);
  const listed = [];
  for (const section of sections) {
    const level = section.match(/^(L[0-3]):/)[1];
    for (const [, id, keyword, scope] of section.matchAll(/^\| \[`(ae\.[^`]+)`\]\(0\.1\.md#[^)]+\) \| (MUST|SHOULD)(?: \(review\))? \| (\w+) \|$/gm)) {
      listed.push({ id, level, keyword, scope });
    }
  }
  const expected = tests.tests.map(({ id, level, keyword, scope }) => ({ id, level, keyword, scope }));
  const key = (t) => t.id;
  assert.deepEqual([...listed].sort((a, b) => key(a).localeCompare(key(b))), [...expected].sort((a, b) => key(a).localeCompare(key(b))));
});

test("levels.md links each id to its heading in the spec", () => {
  for (const [, id, anchor] of levelsDoc.matchAll(/\[`(ae\.[^`]+)`\]\(0\.1\.md#([^)]+)\)/g)) {
    const r = reqs.find((req) => req.id === id);
    // GitHub's heading slug: lowercase, punctuation other than "-" dropped, spaces become "-".
    const slug = `${r.section}.${r.n}. \`${id}\``.toLowerCase().replace(/[^\w\- ]/g, "").replace(/ /g, "-");
    assert.equal(anchor, slug, id);
  }
});
