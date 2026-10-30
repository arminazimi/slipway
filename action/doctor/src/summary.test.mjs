import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { badgeJson, summaryMarkdown } from "./summary.mjs";

const report = (overrides = {}) => ({
  spec: "agent-editable",
  version: "0.1",
  level: "L3",
  notRun: [],
  tests: [],
  findings: [],
  ...overrides,
});

test("a clean report shows the level, the counts, and no findings", () => {
  const markdown = summaryMarkdown(report(), { source: process.cwd(), build: null });
  assert.match(markdown, /^## slipway doctor$/m);
  assert.match(markdown, /^\*\*Level: L3\*\* \(agent-editable 0\.1\) — 0 errors, 0 warnings$/m);
  assert.ok(markdown.includes("No findings."), markdown);
  assert.ok(!markdown.includes("| Test |"), markdown);
});

test("many findings become one table row each, with the location and the message", () => {
  const folders = { source: join(process.cwd(), "site"), build: join(process.cwd(), "site", "_site") };
  const markdown = summaryMarkdown(
    report({
      findings: [
        { id: "ae.schemas.valid", severity: "error", in: "source", file: "pages/index.md", line: 2, message: "title: must be string" },
        { id: "ae.sourcemap.present", severity: "warning", in: "output", file: "index.html", message: "no source map" },
        { id: "ae.sourcemap.links", severity: "warning", message: "needs the output folder" },
      ],
    }),
    folders,
  );
  assert.match(markdown, /^\*\*Level: L3\*\* \(agent-editable 0\.1\) — 1 error, 2 warnings$/m);
  assert.match(markdown, /^\| Test \| Location \| Message \|$/m);
  assert.ok(markdown.includes("| ae.schemas.valid | site/pages/index.md:2 | title: must be string |"), markdown);
  assert.ok(markdown.includes("| ae.sourcemap.present | site/_site/index.html | no source map |"), markdown);
  assert.ok(markdown.includes("| ae.sourcemap.links | needs the output folder | needs the output folder |"), markdown);
});

test("pipes and newlines cannot break the table", () => {
  const markdown = summaryMarkdown(
    report({ findings: [{ id: "x.y", severity: "warning", message: "50% | more\nnext" }] }),
    { source: process.cwd(), build: null },
  );
  assert.ok(markdown.includes("| x.y | 50% \\| more<br>next | 50% \\| more<br>next |"), markdown);
});

test("no level shows L0 as not reached, and tests not run get a line", () => {
  const markdown = summaryMarkdown(report({ level: null, notRun: ["ae.review", "ae.network"] }), { source: process.cwd(), build: null });
  assert.match(markdown, /^\*\*Level: L0\*\* \(not reached\) \(agent-editable 0\.1\) — 0 errors, 0 warnings$/m);
  assert.ok(markdown.includes("Not run: ae.review, ae.network."), markdown);
});

test("the badge maps each level to its colour, and red without a level", () => {
  const badges = [
    ["L3", "L3", "green"],
    ["L2", "L2", "yellow"],
    ["L1", "L1", "orange"],
    ["L0", "L0", "red"],
    [null, "L0", "red"],
  ];
  for (const [level, message, color] of badges) {
    assert.deepEqual(badgeJson({ level }), { schemaVersion: 1, label: "slipway doctor", message, color });
  }
});

test("run.mjs writes the summary and the badge only when their paths are set", () => {
  const run = readFileSync(fileURLToPath(new URL("../run.mjs", import.meta.url)), "utf8");
  assert.match(run, /\bGITHUB_STEP_SUMMARY\b/);
  assert.match(run, /\bSLIPWAY_BADGE_FILE\b/);
  assert.match(run, /summaryMarkdown\(report, folders\)/);
  assert.match(run, /badgeJson\(report\)/);
});
