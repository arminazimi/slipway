// Lints the task briefs in planning/roadmap/briefs/: every non-maintainer brief has the
// sections build.mjs merges into an issue, and the files it names can exist where it says
// they do. Runs on the real roadmap so a new or edited brief is checked by `npm test`.

import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { parseRoadmap } from "./parse.mjs";
import { DONE } from "./status.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const briefsDir = join(here, "briefs");

const { tasks, errors } = parseRoadmap(readFileSync(join(root, "ROADMAP.md"), "utf8"));
assert.deepEqual(errors, [], "ROADMAP.md must parse");
const taskByKey = new Map(tasks.map((task) => [task.key, task]));

const briefFiles = readdirSync(briefsDir)
  .filter((file) => file.endsWith(".md") && file !== "README.md")
  .sort();

const briefText = new Map(briefFiles.map((file) => [file.slice(0, -".md".length), readFileSync(join(briefsDir, file), "utf8")]));

// Briefs whose pull request goes to another repository. Their paths are relative to that
// repository, so only the section headings can be checked here.
const OTHER_REPOSITORY = /This pull request goes to \*\*(?!arminazimi\/slipway\b)[^*]+\*\*/;

// Known gaps in today's briefs. Each is reported as a test diagnostic instead of a failure
// so the suite stays green while the brief cannot be corrected without inventing content.
// Add an entry only with a note in the pull request that explains the gap.
const KNOWN_INCOMPLETE = new Map([
  ["agent.plugins", "legacy Context/Steps brief: no Goal, Files, or Done when"],
  ["parallel.merge-safe", "legacy proposal: no Goal or Files"],
]);
const KNOWN_MISSING_EDITS = new Map([
  ["og.layouts", "tools/og/render.mjs"],
  ["pages.spec-nav", "spec/docs-site/_config.yml"],
]);
const KNOWN_MISSING_PARENTS = new Map([
  ["host.build", "tools/host/fixtures"],
  ["host.import-wiki", "tools/host/fixtures"],
]);
// Tasks whose main file already merged but whose brief also lists a test or doc that has
// not landed yet. They are not done, but their Create paths are not stale typos either.
const PARTIAL_IMPLEMENTATIONS = new Set(["cli.info", "mcp.find-text", "og.render", "parallel.css-components", "starter.links"]);

const stripFences = (markdown) => {
  let fence = null;
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^(`{3,})/);
      if (match) {
        if (fence === null) fence = match[1];
        else if (match[1].length >= fence.length) fence = null;
        return "";
      }
      return fence === null ? line : "";
    })
    .join("\n");
};

const headings = (markdown) => {
  const found = new Set();
  for (const line of stripFences(markdown).split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) found.add(match[1].toLowerCase());
  }
  return found;
};

/**
 * Older briefs keep their file list in a `## Agent brief` section under a bold **Files**
 * label. Accept that as the Files section so those briefs do not have to be rewritten.
 */
const hasFilesSection = (markdown) => {
  if (headings(markdown).has("files")) return true;
  let agentBrief = false;
  for (const line of stripFences(markdown).split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      agentBrief = match[1].toLowerCase() === "agent brief";
      continue;
    }
    if (agentBrief && /^\*\*Files\*\*\s*$/.test(line)) return true;
  }
  return false;
};

/**
 * Returns the path at the start of a bullet, or null. Only a backticked path counts, so
 * prose that mentions other files in the same bullet is not mistaken for a second path.
 * Globs, placeholders such as `<lang>`, version refs, and bare words are ignored.
 */
const pathAtStart = (text) => {
  const match = text.match(/^`([^`]+)`/);
  if (!match) return null;
  const path = match[1].trim();
  if (!path || /\s/.test(path) || path.startsWith("-") || path.includes(":")) return null;
  if (/[*?{}[\]<>]|\.\.\.|@|(^|\/)\.\.(\/|$)/.test(path)) return null;
  if (!/^[A-Za-z0-9_./-]+$/.test(path)) return null;
  if (!path.endsWith("/") && !path.includes("/") && !/\.[A-Za-z0-9]+$/.test(path)) return null;
  return path;
};

/** Splits a brief's `## Files` section into its **Create** and **Edit** paths. */
const filesLists = (markdown) => {
  const lists = { create: [], edit: [] };
  let section = null;
  let list = null;
  for (const line of stripFences(markdown).split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      section = heading[1].toLowerCase();
      list = null;
      continue;
    }
    const bold = line.match(/^\*\*(Create|Edit)\*\*\s*$/);
    if (bold) {
      list = bold[1].toLowerCase();
      continue;
    }
    if (section !== "files" || !list) continue;
    const bullet = line.match(/^\s*-\s+(.*)$/);
    if (!bullet) continue;
    const path = pathAtStart(bullet[1]);
    if (path) lists[list].push(path);
  }
  return lists;
};

const normalize = (path) => path.replace(/\/+$/, "");
const exists = (path) => existsSync(join(root, normalize(path)));
const isDirectory = (path) => exists(path) && statSync(join(root, normalize(path))).isDirectory();

/** Every task the key depends on, directly or through another dependency. */
const dependencies = (key) => {
  const found = new Set();
  const pending = [...(taskByKey.get(key)?.deps ?? [])];
  while (pending.length) {
    const dependency = pending.pop();
    if (found.has(dependency)) continue;
    found.add(dependency);
    pending.push(...(taskByKey.get(dependency)?.deps ?? []));
  }
  return found;
};

/**
 * A task is done when status.mjs says so, or when every file its brief tells it to create
 * is already present. The second half is a stand-in for a closed issue: the repository has
 * no local record of issue state, and most tasks were implemented before their issue closed.
 */
const isDone = (key, lists) => Object.hasOwn(DONE, key) || (lists.create.length > 0 && lists.create.every(exists));

const pathLists = (key) => {
  const markdown = briefText.get(key);
  return markdown ? filesLists(markdown) : { create: [], edit: [] };
};

test("every brief names a roadmap task", () => {
  const unknown = briefFiles.map((file) => file.slice(0, -".md".length)).filter((key) => !taskByKey.has(key));
  assert.deepEqual(unknown, [], "planning/roadmap/briefs/<key>.md must match a task key in ROADMAP.md");
});

test("every non-maintainer brief has Goal, Files, and Done when", (t) => {
  const violations = [];
  for (const file of briefFiles) {
    const key = file.slice(0, -".md".length);
    const task = taskByKey.get(key);
    assert.ok(task, `${key} has a brief but no task in ROADMAP.md`);
    if (task.lane === "maintainer") continue;
    const markdown = briefText.get(key);
    const found = headings(markdown);
    const missing = [];
    if (!found.has("goal")) missing.push("## Goal");
    if (!hasFilesSection(markdown)) missing.push("## Files");
    if (!found.has("done when")) missing.push("## Done when");
    if (!missing.length) continue;
    if (KNOWN_INCOMPLETE.has(key)) {
      t.diagnostic(`${key}: missing ${missing.join(", ")} (${KNOWN_INCOMPLETE.get(key)})`);
      continue;
    }
    violations.push(`${key}: missing ${missing.join(", ")}`);
  }
  assert.deepEqual(violations, [], "non-maintainer briefs must have Goal, Files, and Done when");
});

test("every Edit path exists or is created by a dependency", (t) => {
  const violations = [];
  for (const file of briefFiles) {
    const key = file.slice(0, -".md".length);
    const task = taskByKey.get(key);
    assert.ok(task, `${key} has a brief but no task in ROADMAP.md`);
    if (task.lane === "maintainer") continue;
    const markdown = briefText.get(key);
    if (OTHER_REPOSITORY.test(markdown)) {
      t.diagnostic(`${key}: paths are in another repository; skipped`);
      continue;
    }

    const createdByDependency = new Set();
    for (const dependency of dependencies(key)) {
      if (isDone(dependency, pathLists(dependency))) continue;
      for (const path of pathLists(dependency).create) createdByDependency.add(path);
    }

    for (const path of filesLists(markdown).edit) {
      if (exists(path) || createdByDependency.has(path)) continue;
      if (KNOWN_MISSING_EDITS.get(key) === path) {
        t.diagnostic(`${key}: Edit ${path} does not exist and no dependency creates it (known gap)`);
        continue;
      }
      violations.push(`${key}: Edit ${path} does not exist and no dependency creates it`);
    }
  }
  assert.deepEqual(violations, [], "Edit paths must exist or be created by an unfinished dependency");
});

test("Create paths do not exist before their task is done", (t) => {
  const violations = [];
  for (const file of briefFiles) {
    const key = file.slice(0, -".md".length);
    const task = taskByKey.get(key);
    assert.ok(task, `${key} has a brief but no task in ROADMAP.md`);
    if (task.lane === "maintainer") continue;
    const markdown = briefText.get(key);
    if (OTHER_REPOSITORY.test(markdown)) continue;

    const lists = filesLists(markdown);
    if (!lists.create.length || isDone(key, lists)) continue;

    // The parent of a new directory is allowed to be missing when the task or one of its
    // dependencies creates another path under that parent, which creates the tree with it.
    const related = [
      ...lists.create,
      ...[...dependencies(key)].flatMap((dependency) => pathLists(dependency).create),
    ];

    for (const path of lists.create) {
      if (exists(path)) {
        if (path.endsWith("/") && !isDirectory(path)) {
          violations.push(`${key}: Create ${path} exists as a file, not a directory`);
        } else if (PARTIAL_IMPLEMENTATIONS.has(key)) {
          t.diagnostic(`${key}: Create ${path} already exists (known partial implementation)`);
        } else {
          violations.push(`${key}: Create ${path} already exists but the task is not done`);
        }
        continue;
      }
      if (!path.endsWith("/")) continue;

      const parent = dirname(normalize(path));
      if (parent === "." || isDirectory(parent)) continue;
      const implied = related.some((other) => other !== path && other.startsWith(parent + "/"));
      if (implied) continue;
      if (KNOWN_MISSING_PARENTS.get(key) === parent) {
        t.diagnostic(`${key}: Create ${path} has no ${parent}/ (known gap)`);
        continue;
      }
      violations.push(`${key}: Create ${path} has no parent ${parent}/`);
    }
  }
  assert.deepEqual(violations, [], "Create paths must not exist before their task is done");
});

test("the file-list parser keeps paths, ignores prose and placeholders, and keeps trailing slashes", () => {
  const sample = `## Goal
Example.

## Files

**Create**
- \`tools/new/\` (a directory)
- \`tools/new/run.mjs\` — the runner
- \`tools/new/<name>.mjs\` for each name
- \`tools/new/*.test.mjs\`
- the template that writes \`search.json\`

**Edit**
- \`package.json\` (one script)
- \`docs/{lang}/\` placeholder
- **bold prose only**

## Done when
- [ ] It works.
`;
  assert.deepEqual(filesLists(sample), {
    create: ["tools/new/", "tools/new/run.mjs"],
    edit: ["package.json"],
  });
});
