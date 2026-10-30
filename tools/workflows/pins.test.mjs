// Every `uses:` outside this repository names a full 40-character commit SHA, with the
// version tag in a comment on the same line: `actions/checkout@<sha> # v7.0.1`.
// A tag or branch moves; a SHA does not. Dependabot updates the pins and the comments
// (.github/dependabot.yml, github-actions).
//
//   node --test tools/workflows/pins.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { parseDocument, visit } from "yaml";
import { root } from "../theme/tokens.mjs";

/** Folders that never hold a workflow or action of this repository. */
const skipped = new Set(["node_modules", "vendor", ".git", ".qoder", "_site", ".seaworthy", ".tmp", "coverage"]);

/** A local action, which needs no pin. */
const local = /^\.\//;

/** `owner/repo[/sub/path]@<40 lowercase hex chars>`. */
const pinned = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*@[0-9a-f]{40}$/;

/** The version in the trailing comment, `# v7.0.1` or `# v12, release 12.6.2`. */
const version = /#\s*v?\d/;

const lineOf = (text, offset) => text.slice(0, offset).split("\n").length;

/**
 * The `uses:` references in one workflow or action file that break the rule, as
 * `file:line` messages. Parses with the `yaml` package, so a `uses:` in a `run:` block
 * is text, not a reference.
 */
export function problems(text, file = "workflow") {
  const doc = parseDocument(text);
  assert.deepEqual(doc.errors, [], `${file} is not valid YAML`);

  const found = [];
  visit(doc, {
    Pair(_, pair) {
      if (pair.key?.value !== "uses") return;
      const node = pair.value;
      if (typeof node?.value !== "string" || !node.range) {
        found.push(`${file}:${lineOf(text, pair.key.range?.[0] ?? 0)}: uses: has no action name`);
        return;
      }
      if (local.test(node.value)) return;

      const at = `${file}:${lineOf(text, node.range[0])}`;
      if (!pinned.test(node.value)) {
        found.push(`${at}: uses: ${node.value} is not pinned to a 40-character commit SHA (owner/repo@sha)`);
        return;
      }
      const lineStart = text.lastIndexOf("\n", node.range[0] - 1) + 1;
      const lineEnd = text.indexOf("\n", node.range[1]);
      const rest = text.slice(node.range[1], lineEnd === -1 ? text.length : lineEnd);
      if (!rest.trimStart().startsWith("#")) {
        found.push(`${at}: uses: ${node.value} has no version comment, add \`# vX.Y.Z\` on the same line`);
      } else if (!version.test(rest)) {
        found.push(`${at}: uses: ${node.value} has no version in its comment, add \`# vX.Y.Z\``);
      }
    },
  });
  return found;
}

/** Every workflow under `.github/workflows/` and every `action.yml`/`action.yaml` in the repository. */
export function actionFiles(dir = root) {
  const files = [];
  const workflows = join(dir, ".github/workflows");
  if (existsSync(workflows)) {
    for (const name of readdirSync(workflows).sort()) {
      if (/\.ya?ml$/.test(name)) files.push(join(workflows, name));
    }
  }
  const walk = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!skipped.has(entry.name)) walk(join(folder, entry.name));
      } else if (/^action\.ya?ml$/.test(entry.name)) {
        files.push(join(folder, entry.name));
      }
    }
  };
  walk(dir);
  return [...new Set(files)];
}

test("every workflow and action pins its third-party actions to a commit SHA", () => {
  const files = actionFiles();
  const workflows = files.filter((file) => relative(root, file).startsWith(".github/workflows/"));
  assert.ok(workflows.length > 0, "found no .github/workflows/*.yml files");
  assert.ok(files.some((file) => relative(root, file) === join("action", "doctor", "action.yml")), "found no action/doctor/action.yml");

  const found = files.flatMap((file) => problems(readFileSync(file, "utf8"), relative(root, file)));
  assert.deepEqual(found, [], `unpinned actions:\n${found.join("\n")}`);
});

test("reports a tag, a branch, a short SHA, and a missing or version-less comment", () => {
  const text = [
    "jobs:",
    "  check:",
    "    steps:",
    "      - uses: actions/checkout@v7",
    "      - uses: actions/setup-node@main",
    "      - uses: actions/cache@55cc834",
    "      - uses: ruby/setup-ruby@7f797815d8adceb1c412e7abefdd1ab4abc47a5f",
    "      - uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # pinned, no version",
    "",
  ].join("\n");
  const found = problems(text, ".github/workflows/ci.yml");
  assert.equal(found.length, 5, found.join("\n"));
  assert.match(found[0], /ci\.yml:4: uses: actions\/checkout@v7 is not pinned/);
  assert.match(found[1], /ci\.yml:5: uses: actions\/setup-node@main is not pinned/);
  assert.match(found[2], /ci\.yml:6: uses: actions\/cache@55cc834 is not pinned/);
  assert.match(found[3], /ci\.yml:7: .* has no version comment/);
  assert.match(found[4], /ci\.yml:8: .* has no version in its comment/);
});

test("accepts local paths and pinned actions whatever the version comment says", () => {
  const text = [
    "jobs:",
    "  check:",
    "    steps:",
    "      - uses: ./action/doctor",
    "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
    "      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0",
    "      - uses: ruby/setup-ruby@7f797815d8adceb1c412e7abefdd1ab4abc47a5f # v1.335.0",
    "      - uses: some/action@0123456789abcdef0123456789abcdef01234567 # v12, release 12.6.2",
    "      - uses: arminazimi/evergreen@21304c78171c303c7263f27e93cec9e1b7c704eb # v0.7.1 + 49 commits, main @ 2026-10-28",
    "",
  ].join("\n");
  assert.deepEqual(problems(text, "ci.yml"), []);
});

test("ignores a uses: line inside a run: block", () => {
  const text = ["jobs:", "  check:", "    steps:", "      - run: |", "          uses: actions/checkout@v7", ""].join("\n");
  assert.deepEqual(problems(text, "ci.yml"), []);
});
