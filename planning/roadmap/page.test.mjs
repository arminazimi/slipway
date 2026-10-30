import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { parse } from "yaml";

import { renderPage } from "./page.mjs";
import { parseRoadmap } from "./parse.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const markdown = readFileSync(join(root, "ROADMAP.md"), "utf8");
const pagePath = join(root, "site", "roadmap.md");
const page = readFileSync(pagePath, "utf8");

function frontMatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "the page starts with YAML front matter");
  return parse(match[1]);
}

test("site/roadmap.md is generated from ROADMAP.md and in sync", () => {
  assert.equal(page, renderPage(markdown), "run node planning/roadmap/page.mjs");
});

test("the page has the doc front matter", () => {
  const data = frontMatter(page);
  assert.equal(data.title, "Roadmap");
  assert.equal(data.layout, "doc");
  assert.equal(data.permalink, "/roadmap/");
  assert.equal(typeof data.description, "string");
  assert.ok(data.description.length > 0, "the description is not empty");
});

test("every milestone and epic from ROADMAP.md appears on the page", () => {
  const { phases, epics, tasks, errors } = parseRoadmap(markdown);
  assert.deepEqual(errors, []);
  assert.ok(phases.length > 0 && epics.length > 0 && tasks.length > 0);

  for (const phase of phases) {
    assert.ok(page.includes(`## ${phase.id} — ${phase.title} (${phase.start} → ${phase.end})`), `milestone ${phase.id}`);
    const inPhase = epics.filter((epic) => epic.phase === phase.id);
    const taskCount = tasks.filter((task) => task.phase === phase.id).length;
    const epicsLabel = `${inPhase.length} epic${inPhase.length === 1 ? "" : "s"}`;
    const tasksLabel = `${taskCount} task${taskCount === 1 ? "" : "s"}`;
    assert.ok(page.includes(`${epicsLabel} · ${tasksLabel}`), `counts for ${phase.id}`);
  }

  for (const epic of epics) {
    assert.ok(page.includes(`### ${epic.title}\n`), `epic ${epic.key}`);
    assert.ok(page.includes(encodeURIComponent(`"slipway-roadmap-key: ${epic.key}"`)), `link for ${epic.key}`);
    assert.ok(page.includes(epic.outcome), `outcome for ${epic.key}`);
    const count = tasks.filter((task) => task.epic === epic.key).length;
    assert.ok(count > 0, `${epic.key} has tasks`);
    assert.ok(page.includes(`**${count} task${count === 1 ? "" : "s"}**`), `task count for ${epic.key}`);
  }
});

test("every milestone links to a GitHub task search", () => {
  const { phases } = parseRoadmap(markdown);
  for (const phase of phases) {
    const query = `is:issue milestone:"${phase.id} — ${phase.title}" label:"type: task"`;
    assert.ok(page.includes(`https://github.com/arminazimi/slipway/issues?q=${encodeURIComponent(query)}`), phase.id);
  }
});
