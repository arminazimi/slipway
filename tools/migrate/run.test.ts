// Tests for the migration CLI (issue #1184): both steps run, the report lists every changed file and
// every manual step, `--dry-run` changes nothing, and a copy of the docs example prints a full report.
import assert from "node:assert/strict";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { formatReport, main, migrateSite, parseArgs } from "./run.ts";

const root = fileURLToPath(new URL("../..", import.meta.url));

const tempSite = () => mkdtempSync(join(tmpdir(), "slipway-migrate-"));
const write = (site: string, file: string, text: string) => {
  mkdirSync(dirname(join(site, file)), { recursive: true });
  writeFileSync(join(site, file), text, "utf8");
};

const CONFIG = `title: Beacon
remote_theme: arminazimi/slipway
plugins:
  - jekyll-remote-theme
defaults:
  - scope:
      path: ""
    values:
      layout: doc
`;

const PAGE = `---
title: Install
layout: page
nav_order: 2
---
# Install

{% include blocks/callout.html type="tip" body="Keep it short." %}

{{ site.title }}
`;

const NAVIGATION = `main:
  - title: Docs
    url: docs/x
`;

test("both steps run, write the files, and the report lists changes and manual steps", () => {
  const site = tempSite();
  try {
    write(site, "_config.yml", CONFIG);
    write(site, "guide/install.md", PAGE);
    write(site, "_data/navigation.yml", NAVIGATION);

    const report = migrateSite(site);

    assert.equal(report.dryRun, false);
    assert.deepEqual(report.changed, ["guide/install.md", "slipway.yml"]);
    assert.deepEqual(report.removed, ["_config.yml"]);
    assert.deepEqual(report.errors, []);
    assert.ok(existsSync(join(site, "slipway.yml")), "slipway.yml is written");
    assert.ok(!existsSync(join(site, "_config.yml")), "the 0.2 config is removed after the write");

    const config = readFileSync(join(site, "slipway.yml"), "utf8");
    assert.match(config, /title: Beacon/);
    assert.match(config, /defaults:/);
    assert.doesNotMatch(config, /remote_theme|plugins/);

    const page = readFileSync(join(site, "guide/install.md"), "utf8");
    assert.match(page, /layout: doc/);
    assert.match(page, /order: 2/);
    assert.match(page, /:::callout\{type="tip"\}/);
    assert.doesNotMatch(page, /include blocks\/callout/);

    const notes = report.manual.map((step) => step.note);
    assert.ok(notes.some((note) => note.startsWith("remote_theme:")), "the default theme is reported dropped");
    assert.ok(notes.some((note) => note.startsWith("plugins:")), "Jekyll plugins are reported dropped");
    assert.ok(notes.some((note) => note.includes("Liquid output {{ site.title }}")), "Liquid is left and reported");
    assert.ok(notes.some((note) => note.includes("url")), "the navigation check is reported");
    assert.ok(report.manual.some((step) => step.file === "guide/install.md" && step.line === 10), "Liquid keeps its line");
    assert.ok(report.manual.some((step) => step.file === "_data/navigation.yml" && step.line === 3), "navigation keeps its line");

    const text = formatReport(report);
    assert.match(text, /Changed files \(2\)/);
    assert.match(text, /Removed files \(1\)/);
    assert.match(text, /Manual steps \(\d+\)/);
    assert.match(text, /Errors \(0\)/);
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});

test("--dry-run reports the same changes and writes nothing", () => {
  const site = tempSite();
  try {
    write(site, "_config.yml", CONFIG);
    write(site, "guide/install.md", PAGE);
    write(site, "_data/navigation.yml", NAVIGATION);
    const before = readFileSync(join(site, "guide/install.md"), "utf8");

    const report = migrateSite(site, { dryRun: true });

    assert.deepEqual(report.changed, ["guide/install.md", "slipway.yml"]);
    assert.deepEqual(report.removed, ["_config.yml"]);
    assert.ok(existsSync(join(site, "_config.yml")), "_config.yml is still there");
    assert.ok(!existsSync(join(site, "slipway.yml")), "slipway.yml was not written");
    assert.equal(readFileSync(join(site, "guide/install.md"), "utf8"), before, "the page was not rewritten");
    assert.match(formatReport(report), /Would change \(2\)/);
    assert.match(formatReport(report), /Would remove \(1\)/);
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});

test("a dry run on a copy of the legacy docs example prints a full report and changes nothing", { skip: !existsSync(join(root, "packages/doctor/test/fixtures/examples/docs/_config.yml")) }, () => {
  const source = join(root, "packages/doctor/test/fixtures/examples/docs");
  const site = tempSite();
  try {
    cpSync(source, site, { recursive: true });
    const configBefore = readFileSync(join(site, "_config.yml"), "utf8");
    const pageBefore = readFileSync(join(site, "guide/install.md"), "utf8");

    const output = execFileSync(process.execPath, [join(root, "tools/migrate/run.ts"), site, "--dry-run"], {
      cwd: root,
      encoding: "utf8",
    });

    assert.match(output, /Slipway migration report/);
    assert.match(output, /Would change \(\d+\)/);
    assert.match(output, /slipway\.yml/);
    assert.match(output, /Would remove \(1\)/);
    assert.match(output, /_config\.yml/);
    assert.match(output, /Manual steps \(\d+\)/);
    assert.equal(readFileSync(join(site, "_config.yml"), "utf8"), configBefore, "_config.yml is unchanged");
    assert.equal(readFileSync(join(site, "guide/install.md"), "utf8"), pageBefore, "the page is unchanged");
    assert.ok(!existsSync(join(site, "slipway.yml")), "slipway.yml was not written");
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});

test("a config that cannot be converted is an error, and neither file is touched", () => {
  const site = tempSite();
  try {
    write(site, "_config.yml", "title: [unbalanced\n");
    write(site, "index.md", "---\nlayout: page\n---\n");

    const report = migrateSite(site);
    assert.ok(report.errors.length > 0);
    assert.ok(report.changed.includes("index.md"), "content still migrates");
    assert.ok(!report.changed.includes("slipway.yml"));
    assert.ok(!report.removed.includes("_config.yml"));
    assert.ok(existsSync(join(site, "_config.yml")), "_config.yml stays for the person to fix");
    assert.ok(!existsSync(join(site, "slipway.yml")), "no invalid slipway.yml is written");

    const log = () => {};
    assert.equal(main([site], log, log), 1, "the CLI exits 1 when a conversion failed");
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
});

test("usage: no directory or --help exits 0, a bad option exits 2, a missing directory exits 1", () => {
  const log: string[] = [];
  const error: string[] = [];
  assert.equal(main([], (line) => log.push(line), (line) => error.push(line)), 0);
  assert.match(log.join("\n"), /Usage: node tools\/migrate\/run\.ts/);
  assert.equal(main(["--help"], (line) => log.push(line), (line) => error.push(line)), 0);
  assert.equal(main(["--nope"], (line) => log.push(line), (line) => error.push(line)), 2);
  assert.match(error.join("\n"), /unknown option --nope/);
  assert.equal(main([join(tmpdir(), "slipway-migrate-does-not-exist")], (line) => log.push(line), (line) => error.push(line)), 1);
});

test("parseArgs accepts the directory before or after --dry-run", () => {
  assert.deepEqual(parseArgs(["docs", "--dry-run"]), { dir: "docs", dryRun: true, help: false });
  assert.deepEqual(parseArgs(["--dry-run", "docs"]), { dir: "docs", dryRun: true, help: false });
  assert.throws(() => parseArgs(["a", "b"]), /expected one site directory/);
});
