// A `${{ ... }}` inside a `run:` script is pasted into the shell before the script runs, so quoting
// the value does not help: a pull request title, a branch name, or a caller's input can carry `$(...)`
// and run with the job's token. Values reach the script through `env:` instead, and the script reads
// `$VAR` like a normal shell variable (docs/adr/0017-threat-model.md).
//
//   node --test tools/workflows/injection.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { parseDocument, visit } from "yaml";
import { root } from "../theme/tokens.mjs";

/** Folders that never hold a workflow or action of this repository. */
const skipped = new Set(["node_modules", "vendor", ".git", ".qoder", "_site", ".seaworthy", ".tmp", "coverage"]);

/** `${{ ... }}`, on one line or wrapped across a few. */
const expression = /\$\{\{([\s\S]*?)\}\}/g;

/**
 * The expressions this check still allows inline, keyed by `file:expression`. release.yml (#718)
 * names the SBOM after the tag's version, and the workflows are outside that issue's file list;
 * it moves to `env:` when release.yml is next edited. Remove the entry then.
 */
const known = new Set([".github/workflows/release.yml:steps.version.outputs.version"]);

const lineOf = (text, offset) => text.slice(0, offset).split("\n").length;

const inline = (text) => text.replace(/\s+/g, "");

/**
 * The expressions interpolated into `run:` scripts in one workflow or action file, as
 * `file:line: message`. Parses with the `yaml` package, so an expression in `env:`, `with:`,
 * `if:`, or any other field is not a script and stays allowed.
 */
export function problems(text, file = "workflow") {
  const doc = parseDocument(text);
  assert.deepEqual(doc.errors, [], `${file} is not valid YAML`);

  const found = [];
  visit(doc, {
    Pair(_, pair) {
      if (pair.key?.value !== "run") return;
      // An alias (`run: *script`) carries no text of its own; its anchor does.
      const node = typeof pair.value?.resolve === "function" ? pair.value.resolve(doc) : pair.value;
      if (typeof node?.value !== "string" || !node.range) return;

      const raw = text.slice(node.range[0], node.range[1]);
      for (const match of raw.matchAll(expression)) {
        const value = match[1].trim();
        if (known.has(`${file}:${inline(value)}`)) continue;
        const at = `${file}:${lineOf(text, node.range[0] + match.index)}`;
        found.push(
          `${at}: run: interpolates \${{ ${value} }}; pass the value through \`env:\` and read \`$NAME\` in the script instead`,
        );
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

test("no workflow or Action interpolates an expression into a run: script", () => {
  const files = actionFiles();
  const workflows = files.filter((file) => relative(root, file).startsWith(".github/workflows/"));
  assert.ok(workflows.length > 0, "found no .github/workflows/*.yml files");
  assert.ok(
    files.some((file) => relative(root, file) === join("action", "doctor", "action.yml")),
    "found no action/doctor/action.yml",
  );

  const found = files.flatMap((file) => problems(readFileSync(file, "utf8"), relative(root, file)));
  assert.deepEqual(found, [], `expressions in run: scripts:\n${found.join("\n")}`);
});
test("reports an expression in a one-line run and in a block script, at its line", () => {
  const text = [
    "jobs:",
    "  check:",
    "    steps:",
    "      - run: echo \"${{ github.event.pull_request.title }}\"",
    "      - run: |",
    "          echo start",
    "          echo \"${{ inputs.path }}\"",
    "          echo \"${{ github.head_ref }}\"",
    "",
  ].join("\n");
  const found = problems(text, ".github/workflows/ci.yml");
  assert.equal(found.length, 3, found.join("\n"));
  assert.match(found[0], /ci\.yml:4: run: interpolates \$\{\{ github\.event\.pull_request\.title \}\}/);
  assert.match(found[0], /pass the value through `env:`/);
  assert.match(found[1], /ci\.yml:7: run: interpolates \$\{\{ inputs\.path \}\}/);
  assert.match(found[2], /ci\.yml:8: run: interpolates \$\{\{ github\.head_ref \}\}/);
});

test("reports a composite Action's input in a run: script", () => {
  const text = [
    "runs:",
    "  using: composite",
    "  steps:",
    "    - shell: bash",
    "      run: node run.mjs --path ${{ inputs.path }}",
    "",
  ].join("\n");
  const found = problems(text, "action/doctor/action.yml");
  assert.equal(found.length, 1, found.join("\n"));
  assert.match(found[0], /action\/doctor\/action\.yml:5: .*inputs\.path/);
});

test("reports an expression behind a YAML anchor", () => {
  const text = [
    "script: &script \"echo ${{ github.event.issue.title }}\"",
    "jobs:",
    "  check:",
    "    steps:",
    "      - run: *script",
    "",
  ].join("\n");
  const found = problems(text, ".github/workflows/ci.yml");
  assert.equal(found.length, 1, found.join("\n"));
  assert.match(found[0], /ci\.yml:1: .*github\.event\.issue\.title/);
});

test("accepts a value that reaches the script through env:", () => {
  const text = [
    "jobs:",
    "  check:",
    "    steps:",
    "      - shell: bash",
    "        env:",
    "          SLIPWAY_PATH: ${{ inputs.path }}",
    "          TITLE: ${{ github.event.pull_request.title }}",
    "        run: |",
    "          node run.mjs --path \"$SLIPWAY_PATH\"",
    "          echo \"$TITLE\"",
    "",
  ].join("\n");
  assert.deepEqual(problems(text, "action/doctor/action.yml"), []);
});

test("ignores expressions outside run:, such as with:, if:, and working-directory:", () => {
  const text = [
    "jobs:",
    "  check:",
    "    name: check (${{ matrix.os }})",
    "    steps:",
    "      - uses: actions/checkout@0123456789abcdef0123456789abcdef01234567 # v7.0.1",
    "        with:",
    "          ref: ${{ github.event.pull_request.head.sha }}",
    "      - if: inputs.setup-node == 'true'",
    "        shell: bash",
    "        working-directory: ${{ github.action_path }}/../..",
    "        run: npm ci",
    "      # run: echo ${{ github.event.issue.title }} is a comment, not a script",
    "",
  ].join("\n");
  assert.deepEqual(problems(text, ".github/workflows/ci.yml"), []);
});
