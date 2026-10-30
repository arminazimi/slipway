import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import { root } from "../theme/tokens.mjs";

const schema = JSON.parse(readFileSync(join(root, "schema/api.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const fixture = JSON.parse(readFileSync(join(root, "tools/api/fixtures/model.json"), "utf8"));

const errorsFor = (model) =>
  validate(model) ? [] : validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`);

const source = { commit: "0f11473", file: "src/index.ts", line: 1 };
const symbol = (over = {}) => ({ kind: "function", name: "run", source, ...over });
const moduleWith = (members) => ({
  generator: "test",
  modules: [{ kind: "module", members, name: "lib", source }],
  version: "0.1",
});

function kinds(model) {
  const found = new Set();
  const walk = (node) => {
    found.add(node.kind);
    for (const member of node.members ?? []) walk(member);
  };
  for (const node of model.modules) walk(node);
  return [...found].sort();
}

test("the fixture validates against the schema", () => {
  assert.deepEqual(errorsFor(fixture), []);
});

test("the fixture covers every kind in the model", () => {
  assert.deepEqual(kinds(fixture), [
    "class",
    "constant",
    "endpoint",
    "function",
    "interface",
    "method",
    "module",
    "type",
  ]);
});

test("an endpoint needs a method and a path", () => {
  const missingPath = errorsFor(moduleWith([symbol({ kind: "endpoint", method: "GET" })]));
  assert.ok(missingPath.some((e) => e.includes("'path'")), missingPath.join("; "));
  assert.deepEqual(errorsFor(moduleWith([symbol({ kind: "endpoint", method: "GET", path: "/run" })])), []);
});

test("only an endpoint carries a method or a path", () => {
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ method: "GET" })])), []);
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ path: "/run" })])), []);
});

test("a container must list its members", () => {
  const model = moduleWith([]);
  model.modules[0] = { kind: "class", name: "Site", source };
  assert.ok(errorsFor(model).some((e) => e.includes("members")));
});

test("an unknown kind is rejected", () => {
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ kind: "property" })])), []);
});

test("a source needs a commit, a relative file, and a 1-based line", () => {
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ source: { ...source, line: 0 } })])), []);
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ source: { ...source, commit: "main" } })])), []);
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ source: { ...source, file: "../outside.ts" } })])), []);
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ source: { file: "src/index.ts", line: 1 } })])), []);
});

test("a name has no whitespace and a deprecated symbol may say nothing more", () => {
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ name: "Site . url" })])), []);
  assert.deepEqual(errorsFor(moduleWith([symbol({ deprecated: {} })])), []);
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ deprecated: true })])), []);
});

test("a parameter names its type, even when the converter knows none", () => {
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ parameters: [{ name: "options" }] })])), []);
  assert.deepEqual(
    errorsFor(moduleWith([symbol({ parameters: [{ name: "options", type: "unknown" }] })])),
    [],
  );
});

test("an example carries code and a language", () => {
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ examples: [{ code: "run()" }] })])), []);
  assert.deepEqual(
    errorsFor(moduleWith([symbol({ examples: [{ code: "run()", lang: "js" }] })])),
    [],
  );
});

test("top-level modules are modules, and the version is 0.1", () => {
  const wrongRoot = moduleWith([]);
  wrongRoot.modules[0] = { kind: "class", members: [], name: "Site", source };
  assert.notDeepEqual(errorsFor(wrongRoot), []);
  assert.notDeepEqual(errorsFor({ ...moduleWith([]), version: "1.0" }), []);
});

test("an unknown field is rejected rather than silently ignored", () => {
  assert.notDeepEqual(errorsFor(moduleWith([symbol({ overloads: ["run(a: string): void"] })])), []);
});
