// Renders site/roadmap.md from ROADMAP.md.
//
//   node planning/roadmap/page.mjs           # write site/roadmap.md
//   node planning/roadmap/page.mjs --check   # fail when the page is stale
//
// The page is generated, so edit ROADMAP.md and regenerate it, never the page. The generator runs offline and
// reads only what parse.mjs returns: ROADMAP.md has no GitHub issue numbers, so the links are GitHub search
// URLs that find the epic by its roadmap-key marker and the milestone's tasks by their labels.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseRoadmap } from "./parse.mjs";

const REPO = "arminazimi/slipway";
const WEB = `https://github.com/${REPO}`;

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const roadmapPath = join(root, "ROADMAP.md");
const pagePath = join(root, "site", "roadmap.md");

/** A GitHub issue search URL for `query`. */
const search = (query) => `${WEB}/issues?q=${encodeURIComponent(query)}`;

/** The search that finds an epic by the marker that starts its issue body. */
const epicUrl = (key) => search(`is:issue "slipway-roadmap-key: ${key}"`);

/** The search that lists a milestone's tasks: apply.mjs titles the milestone "<id> — <title>". */
const tasksUrl = (phase) => search(`is:issue milestone:"${phase.id} — ${phase.title}" label:"type: task"`);

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * Renders the public roadmap page from the text of ROADMAP.md.
 * @param {string} markdown
 * @returns {string} the full page, front matter included
 */
export function renderPage(markdown) {
  const { phases, epics, tasks, errors } = parseRoadmap(markdown);
  if (errors.length) throw new Error(`ROADMAP.md does not parse:\n${errors.map((e) => `  ${e}`).join("\n")}`);

  const lines = [
    "---",
    "title: Roadmap",
    "description: The public roadmap, milestone by milestone, with every epic and the outcome it delivers.",
    "layout: doc",
    "permalink: /roadmap/",
    "---",
    "<!-- Generated from ROADMAP.md by planning/roadmap/page.mjs. Do not edit by hand. -->",
    "",
    `The plan behind Slipway, milestone by milestone. [ROADMAP.md](${WEB}/blob/main/ROADMAP.md) is the source of truth; this page is generated from it. Every epic is a tracking issue, and every task is one pull request that adds a small, independently reviewable change. New here? [CONTRIBUTING.md](${WEB}/blob/main/CONTRIBUTING.md) explains how to claim one.`,
  ];

  for (const phase of phases) {
    const phaseEpics = epics.filter((epic) => epic.phase === phase.id);
    const phaseTasks = tasks.filter((task) => task.phase === phase.id);

    const meta = [`${plural(phaseEpics.length, "epic")}`, plural(phaseTasks.length, "task")];
    if (phase.release !== "none") meta.unshift(`Release ${phase.release}`);

    lines.push(
      "",
      `## ${phase.id} — ${phase.title} (${phase.start} → ${phase.end})`,
      "",
      `${meta.join(" · ")} · [Search GitHub for this milestone's tasks](${tasksUrl(phase)})`,
    );

    for (const epic of phaseEpics) {
      const count = tasks.filter((task) => task.epic === epic.key).length;
      lines.push("", `### ${epic.title}`, "", epic.outcome, "", `**${plural(count, "task")}** · [Epic issue](${epicUrl(epic.key)})`);
    }
  }

  return lines.join("\n") + "\n";
}

export function renderFile() {
  return renderPage(readFileSync(roadmapPath, "utf8"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expected = renderFile();
  if (process.argv.includes("--check")) {
    let actual = null;
    try {
      actual = readFileSync(pagePath, "utf8");
    } catch {}
    if (actual !== expected) {
      console.error(`${pagePath} is stale; run node planning/roadmap/page.mjs`);
      process.exit(1);
    }
    console.log("OK: site/roadmap.md is in sync with ROADMAP.md");
  } else {
    writeFileSync(pagePath, expected);
    console.log(`wrote ${pagePath}`);
  }
}
