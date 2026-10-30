import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { hint, hintFor } from "../src/checks/agent.skill-hint.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const fixture = (name) => here(`fixtures/${name}`);
const bin = here("../bin/slipway.mjs");
const run = (name, ...args) => spawnSync(process.execPath, [bin, "doctor", fixture(name), ...args], { encoding: "utf8" });

test("a site without skills gets one hint line in the text output", () => {
  const source = fixture("no-skill");
  assert.equal(hintFor({ source, build: join(source, "build") }), hint);
  assert.equal(hintFor({ source, build: null }), hint);
  const result = run("no-skill", "--build", join(source, "build"));
  assert.equal(result.stdout.split("\n").filter((line) => line === hint).length, 1);
});

test("a site with skills gets no hint", () => {
  const source = fixture("conforming");
  assert.equal(hintFor({ source, build: join(source, "build") }), null);
  const result = run("conforming", "--build", join(source, "build"));
  assert.ok(!result.stdout.includes(hint));
});

test("AGENTS.md that names a skill counts as having one", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-skill-hint-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture("no-skill"), dir, { recursive: true });
  appendFileSync(join(dir, "AGENTS.md"), "\nUse the slipway-doctor skill after each edit.\n");
  assert.equal(hintFor({ source: dir, build: join(dir, "build") }), null);
});

test("the hint stays out of the JSON and SARIF reports", () => {
  const source = fixture("no-skill");
  const args = ["--build", join(source, "build")];

  const json = run("no-skill", ...args, "--format", "json");
  const report = JSON.parse(json.stdout);
  assert.ok(!("hint" in report));
  assert.ok(report.tests.every((test) => test.id !== "agent.skill-hint"));
  assert.ok(!json.stdout.includes(hint));

  const sarif = run("no-skill", ...args, "--format", "sarif");
  JSON.parse(sarif.stdout);
  assert.ok(!sarif.stdout.includes(hint));
});
