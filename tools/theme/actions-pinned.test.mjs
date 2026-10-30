// Every GitHub Action the repository runs is pinned to a commit SHA, so a tag that moves cannot
// change what CI runs. The version stays readable in the trailing comment, and a local action
// (./action/doctor) runs the code in this repository: there is nothing to pin.
//
//   node --test tools/theme/actions-pinned.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";

const root = join(import.meta.dirname, "../..");
const commit = /^[0-9a-f]{40}$/;
const version = /\bv?\d+\.\d+/;

/** The workflows in .github/workflows and the composite action manifests in action/. */
export function actionFiles(dir = root) {
  const files = [];
  const workflows = join(dir, ".github/workflows");
  if (existsSync(workflows)) {
    for (const name of readdirSync(workflows).sort()) {
      if (name.endsWith(".yml") || name.endsWith(".yaml")) files.push(join(workflows, name));
    }
  }
  const actions = join(dir, "action");
  if (existsSync(actions)) {
    for (const entry of readdirSync(actions, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      for (const name of ["action.yml", "action.yaml"]) {
        const path = join(actions, entry.name, name);
        if (existsSync(path)) files.push(path);
      }
    }
  }
  return files;
}

/** The `uses:` values in one file, each with its line number and its trailing comment. */
export function usesValues(content) {
  return content.split("\n").flatMap((line, index) => {
    const match = line.match(/^\s*(?:-\s*)?uses:\s*(\S+)\s*(?:#\s*(.*?))?\s*$/);
    return match ? [{ line: index + 1, ref: match[1], comment: match[2] ?? "" }] : [];
  });
}

/** The problems in one file: a third-party action must name a commit SHA and its version. */
export function problems(content, file = "") {
  const found = [];
  for (const { line, ref, comment } of usesValues(content)) {
    if (ref.startsWith("./") || ref.startsWith("docker://")) continue;
    const parts = /^([^@]+)@(.+)$/.exec(ref);
    if (!parts) {
      found.push(`${file}:${line}: uses: ${ref} names no action version`);
      continue;
    }
    const [, name, sha] = parts;
    if (!commit.test(sha)) {
      found.push(`${file}:${line}: uses: ${name}@${sha} is not pinned to a 40-character commit SHA`);
      continue;
    }
    if (!version.test(comment)) {
      found.push(`${file}:${line}: uses: ${name}@${sha} has no version comment`);
    }
  }
  return found;
}

test("every action the repository runs is pinned to a commit SHA", () => {
  const files = actionFiles();
  const names = files.map((file) => relative(root, file));
  assert.ok(names.includes(".github/workflows/ci.yml"), "the CI workflow must be checked");
  assert.ok(names.includes("action/doctor/action.yml"), "the doctor Action must be checked");

  const found = files.flatMap((file) => problems(readFileSync(file, "utf8"), relative(root, file)));
  assert.deepEqual(found, [], found.join("\n"));
});

test("an unpinned action is a problem", () => {
  const found = problems("      - uses: actions/checkout@v4\n", "sample.yml");
  assert.equal(found.length, 1);
  assert.match(found[0], /^sample\.yml:1: uses: actions\/checkout@v4 is not pinned/);
});

test("a pinned action with a version comment has no problem", () => {
  const found = problems("      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1\n", "sample.yml");
  assert.deepEqual(found, []);
});

test("a pinned action without a version comment is a problem", () => {
  const found = problems("      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1\n", "sample.yml");
  assert.equal(found.length, 1);
  assert.match(found[0], /has no version comment/);
});

test("a local action needs no pin", () => {
  assert.deepEqual(problems("        uses: ./action/doctor\n", "sample.yml"), []);
  assert.deepEqual(problems("        uses: docker://alpine:3.21\n", "sample.yml"), []);
});
