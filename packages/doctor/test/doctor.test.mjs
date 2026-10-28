import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { doctor, levelReached, loadTests } from "../src/doctor.mjs";
import { checks } from "../src/checks.mjs";
import { exitCode, formatFinding, parseArgs } from "../src/cli.mjs";
import { locate, toSarif } from "../src/report.mjs";
import { globToRegExp } from "../src/glob.mjs";
import { codeSpans, headings } from "../src/markdown.mjs";
import { parse, walk } from "../src/html.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const bin = here("../bin/slipway.mjs");
const fixture = (name) => here(`fixtures/${name}`);
const run = (name) => doctor(fixture(name), { build: join(fixture(name), "build") });
const failed = (report) => report.tests.filter((t) => t.status === "fail").map((t) => t.id);

/** A copy of the conforming fixture, changed by `edit(dir)`, removed after the test. */
function variant(t, edit) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-doctor-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture("conforming"), dir, { recursive: true });
  edit(dir);
  return doctor(dir, { build: join(dir, "build") });
}

const edit = (path, from, to) => writeFileSync(path, readFileSync(path, "utf8").replace(from, to));

test("the conforming fixture reaches L3 with only the review and detection tests not run", async () => {
  const report = await run("conforming");
  assert.equal(report.level, "L3");
  assert.deepEqual(report.findings, []);
  assert.deepEqual(report.notRun.sort(), ["ae.edit-prompt.content", "ae.edit-prompt.no-send", "ae.schemas.config"]);
});

test("a site without AGENTS.md has no level", async () => {
  const report = await run("missing-agents");
  assert.equal(report.level, null);
  assert.ok(report.findings.some((f) => f.id === "ae.agents-md.present" && f.file === "AGENTS.md" && f.message === "is missing"));
});

test("invalid front matter stops at L0 with the file, line, key, and allowed values", async () => {
  const report = await run("invalid-front-matter");
  assert.equal(report.level, "L0");
  const valid = report.findings.filter((f) => f.id === "ae.schemas.valid");
  assert.deepEqual(
    valid.map(({ file, line, key, severity }) => ({ file, line, key, severity })),
    [
      { file: "pages/index.md", line: 2, key: "title", severity: "error" },
      { file: "pages/index.md", line: 3, key: "colour", severity: "error" },
    ],
  );
  assert.deepEqual(valid[1].allowed, ["title", "layout"]);
});

test("every automated test in tests.json has a check, except the one that needs generator detection", () => {
  const ids = loadTests().tests.filter((t) => t.how === "automated").map((t) => t.id);
  assert.deepEqual(ids.filter((id) => !checks[id]), []);
assert.deepEqual(Object.keys(checks).filter((id) => !ids.includes(id)), ["unknown-config", "unknown-front-matter", "doctor.twin-fresh"]);
});

test("the packaged spec files match the repository's", () => {
  for (const [copy, original] of [
    ["../spec/tests.json", "spec/agent-editable/tests.json"],
    ["../schema/content-schemas.schema.json", "schema/content-schemas.schema.json"],
    ["../schema/sourcemap.schema.json", "schema/sourcemap.schema.json"],
  ]) {
    assert.equal(readFileSync(here(copy), "utf8"), readFileSync(join(repo, original), "utf8"), `${copy} is stale: copy ${original}`);
  }
});

test("a failing SHOULD is a warning and never lowers the level", async (t) => {
  const report = await variant(t, (dir) => edit(join(dir, "AGENTS.md"), "## Never", "## Notes"));
  assert.equal(report.level, "L3");
  assert.deepEqual(report.findings.map((f) => [f.id, f.severity]), [["ae.agents-md.never", "warning"]]);
});

test("the level is the highest one whose MUST tests and those below all pass", () => {
  const result = (level, status, keyword = "MUST") => ({ level, keyword, status });
  assert.equal(levelReached([result("L0", "pass"), result("L1", "fail"), result("L2", "pass")]), "L0");
  assert.equal(levelReached([result("L0", "fail"), result("L1", "pass")]), null);
  assert.equal(levelReached([result("L0", "pass"), result("L1", "not-run"), result("L1", "fail", "SHOULD")]), "L3");
});

test("AGENTS.md: paths that do not exist are reported with their line; placeholders and the output folder are not", async (t) => {
  const report = await variant(t, (dir) =>
    writeFileSync(join(dir, "AGENTS.md"), `${readFileSync(join(dir, "AGENTS.md"), "utf8")}\nPosts go in \`pages/<slug>.md\`, never \`build/guide/\`; see \`docs/old.md\`.\n`),
  );
  assert.deepEqual(
    report.findings.map(({ id, line, message }) => ({ id, line, message })),
    [{ id: "ae.agents-md.paths-exist", line: 18, message: "`docs/old.md` does not exist in the source folder" }],
  );
});

test("AGENTS.md must name the output folder when one is given", async (t) => {
  const report = await variant(t, (dir) => edit(join(dir, "AGENTS.md"), /`build\/`/g, "the output folder"));
  assert.deepEqual(failed(report), ["ae.agents-md.layout"]);
});

test("source map: a stale line, a heading at another level, and a wrong data-source are each reported", async (t) => {
  const report = await variant(t, (dir) => {
    edit(join(dir, "pages/index.md"), "# Welcome", "# Hello");
    edit(join(dir, "build/guide/index.html"), /h1/g, "h2");
    edit(join(dir, "build/index.html"), "pages/index.md:6", "pages/index.md:7");
  });
  assert.equal(report.level, "L1");
  const byTest = Object.fromEntries(report.findings.map((f) => [f.id, f]));
  assert.equal(byTest["ae.sourcemap.lines"].file, "pages/index.md");
  assert.equal(byTest["ae.sourcemap.lines"].line, 6);
  assert.match(byTest["ae.sourcemap.ids"].message, /is an h2, the map says h1/);
  assert.match(byTest["ae.edit-prompt.source"].message, /has data-source pages\/index.md:7, expected pages\/index.md:6/);
});

test("source map: duplicate and missing urls fail L0", async (t) => {
  const report = await variant(t, (dir) => {
    const path = join(dir, "build/sourcemap.json");
    const map = JSON.parse(readFileSync(path, "utf8"));
    map.pages.push({ url: "/", source: "pages/index.md" }, { url: "/gone/", source: "pages/gone.md" });
    writeFileSync(path, JSON.stringify(map));
  });
  assert.equal(report.level, null);
  assert.deepEqual(failed(report).sort(), ["ae.sourcemap.lines", "ae.sourcemap.present", "ae.sourcemap.sources-exist", "ae.sourcemap.urls-exist"]);
});

test("content files: a page no front-matter entry covers fails ae.schemas.content and is missing from coverage", async (t) => {
  const report = await variant(t, (dir) => {
    edit(join(dir, "content-schemas.json"), '"pages/**/*.md"', '"pages/index.md"');
    writeFileSync(join(dir, "pages/draft.md"), "---\ntitle: Draft\n---\n");
    edit(join(dir, "content-schemas.json"), '"pages/index.md"', '"pages/index.md", "pages/draft.md"');
  });
  assert.equal(report.level, "L0");
  assert.deepEqual(failed(report).sort(), ["ae.schemas.content", "ae.sourcemap.coverage"]);
});

test("schemas: a missing schema fails resolve; an open, undescribed one only warns", async (t) => {
  const missing = await variant(t, (dir) => unlinkSync(join(dir, "schema/config.schema.json")));
  assert.deepEqual(failed(missing), ["ae.schemas.resolve"]);
  const open = await variant(t, (dir) => writeFileSync(join(dir, "schema/config.schema.json"), '{ "type": "object", "properties": { "title": {} } }'));
  assert.equal(open.level, "L3");
  assert.deepEqual(failed(open).sort(), ["ae.schemas.closed", "ae.schemas.described"]);
});

test("schemas: an https schema is not run without --network", async (t) => {
  const report = await variant(t, (dir) => edit(join(dir, "content-schemas.json"), '"schema/config.schema.json"', '"https://example.com/config.schema.json"'));
  assert.equal(report.level, "L3");
  const resolve = report.tests.find((r) => r.id === "ae.schemas.resolve");
  assert.equal(resolve.status, "pass");
  assert.match(resolve.reason, /needs the network/);
});

test("a control with data-edit-prompt that is not hidden warns", async (t) => {
  const report = await variant(t, (dir) => edit(join(dir, "build/index.html"), " hidden>", ">"));
  assert.equal(report.level, "L3");
  assert.deepEqual(failed(report), ["ae.edit-prompt.without-script"]);
});

test("skills: a SKILL.md whose name differs from the index fails L3", async (t) => {
  const report = await variant(t, (dir) => edit(join(dir, "build/.well-known/agent-skills/edit-example/SKILL.md"), "name: edit-example", "name: other"));
  assert.equal(report.level, "L2");
  assert.deepEqual(failed(report), ["ae.skills.resolve"]);
});

test("without --build the output tests fail and say why", async () => {
  const report = await doctor(fixture("conforming"));
  assert.equal(report.level, null);
  assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.present" && /--build/.test(f.message)));
});

test("globs: * stays in one segment and ** spans any number", () => {
  assert.ok(globToRegExp("pages/*.md").test("pages/a.md"));
  assert.ok(!globToRegExp("pages/*.md").test("pages/x/a.md"));
  assert.ok(globToRegExp("pages/**/*.md").test("pages/a.md"));
  assert.ok(globToRegExp("pages/**/*.md").test("pages/x/y/a.md"));
  assert.ok(globToRegExp("**/*.md").test("a.md"));
  assert.ok(!globToRegExp("a.md").test("aXmd"));
});

test("Markdown: code spans outside fences, and headings followed by a list", () => {
  const text = "Edit `a/b.md`.\n\n```sh\necho `c/d.md`\n```\n\n## Never\n\n- x\n\n## Notes\n";
  assert.deepEqual(codeSpans(text), [{ line: 1, value: "a/b.md" }]);
  assert.deepEqual(headings(text).map(({ text, hasList }) => [text, hasList]), [["Never", true], ["Notes", false]]);
});

test("arguments: usage errors are reported, and --level picks the exit code", () => {
  assert.equal(parseArgs(["doctor"]).error, "missing <source-dir>");
  assert.equal(parseArgs(["check", "x"]).error, "unknown command: check");
  assert.equal(parseArgs(["doctor", "x", "--format", "xml"]).error, "--format must be text, json, or sarif, not xml");
  assert.equal(parseArgs(["doctor", "x", "--level", "L9"]).error, "--level must be one of L0, L1, L2, L3");
  assert.equal(parseArgs(["doctor", "x", "--build"]).error, "--build needs a value");
  const report = { level: "L1", tests: [{ keyword: "MUST", status: "fail" }] };
  assert.equal(exitCode(report, "L1"), 0);
  assert.equal(exitCode(report, "L2"), 1);
  assert.equal(exitCode(report), 1);
});

function cli(...args) {
  return spawnSync(process.execPath, [bin, ...args], { cwd: repo, encoding: "utf8" });
}

test("cli: examples/docs prints a level and findings", () => {
  const result = cli("doctor", "examples/docs");
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^level: (none|L[0-3]) /m);
  assert.match(result.stdout, /examples\/docs\/AGENTS\.md is missing/);
});

test("cli: --fix dry-run output contains unified diffs for missing stubs and deprecations without modifying files", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-fix-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture("jekyll-deprecated"), dir, { recursive: true });

  // Remove AGENTS.md to trigger the stub rule
  unlinkSync(join(dir, "AGENTS.md"));

  const originalPage = readFileSync(join(dir, "fa/index.md"), "utf8");
  assert.ok(!existsSync(join(dir, "AGENTS.md")), "AGENTS.md should not exist yet");

  // Read deprecations manually to inject into doctor
  const deprecations = JSON.parse(readFileSync(join(dir, "deprecations.json"), "utf8")).deprecations;

  // Run with doctor directly since cli doesn't load custom deprecations
  const report = await doctor(dir, { deprecations });
  const { applyFixes } = await import("../src/fix.mjs");
  const diffs = applyFixes(report, dir, { dryRun: true });
  const stdout = diffs.join("\n");

  // File should still not exist
  assert.ok(!existsSync(join(dir, "AGENTS.md")), "AGENTS.md should still not exist after dry run");
  assert.equal(readFileSync(join(dir, "fa/index.md"), "utf8"), originalPage, "fa/index.md should not be modified after dry run");

  // Output should contain diffs
  assert.ok(stdout.includes("--- /dev/null\n+++ AGENTS.md"));
  assert.ok(stdout.includes("--- fa/index.md\n+++ fa/index.md"));
  assert.ok(stdout.includes("-fixture_kicker:"));
  assert.ok(stdout.includes("+fixture_eyebrow:"));
});

test("cli: --fix applies fixes and prints unified diffs", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-fix-apply-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture("jekyll-deprecated"), dir, { recursive: true });

  // Remove AGENTS.md to trigger the stub rule
  unlinkSync(join(dir, "AGENTS.md"));

  const originalPage = readFileSync(join(dir, "fa/index.md"), "utf8");

  // Read deprecations manually to inject into doctor
  const deprecations = JSON.parse(readFileSync(join(dir, "deprecations.json"), "utf8")).deprecations;

  // Run with doctor directly since cli doesn't load custom deprecations
  const report = await doctor(dir, { deprecations });
  const { applyFixes } = await import("../src/fix.mjs");
  const diffs = applyFixes(report, dir, { dryRun: false });
  const stdout = diffs.join("\n");

  // Fixes should be applied
  assert.ok(existsSync(join(dir, "AGENTS.md")), "AGENTS.md should exist after fix");
  const newPage = readFileSync(join(dir, "fa/index.md"), "utf8");
  assert.notEqual(newPage, originalPage, "fa/index.md should be modified");
  assert.ok(newPage.includes("fixture_eyebrow:"), "Deprecated key should be replaced");
  assert.ok(!newPage.includes("fixture_kicker:"), "Old key should be gone");

  // Output should contain diffs
  assert.ok(stdout.includes("--- /dev/null\n+++ AGENTS.md"));
  assert.ok(stdout.includes("--- fa/index.md\n+++ fa/index.md"));
});

test("cli: json output has the spec, version, level, and the tests not run", () => {
  const dir = "packages/doctor/test/fixtures/conforming";
  const result = cli("doctor", dir, "--build", `${dir}/build`, "--format", "json");
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.spec, "agent-editable");
  assert.equal(report.version, "0.1");
  assert.equal(report.level, "L3");
  assert.ok(report.notRun.includes("ae.edit-prompt.no-send"));
});

test("cli: --level, usage errors, and a missing folder give exit codes 0, 1, and 2", () => {
  const dir = "packages/doctor/test/fixtures/invalid-front-matter";
  assert.equal(cli("doctor", dir, "--build", `${dir}/build`, "--level", "L0").status, 0);
  assert.equal(cli("doctor", dir, "--build", `${dir}/build`, "--level", "L1").status, 1);
  assert.equal(cli("doctor").status, 2);
  assert.equal(cli("doctor", "no/such/folder").status, 2);
  assert.match(cli("--help").stdout, /Usage: slipway doctor/);
});

test("right-to-left: a dir that disagrees with lang, and one finding per unisolated mixed title, h1, and nav link", async () => {
  const report = await run("rtl-mixed");
  const found = (id) => report.findings.filter((f) => f.id === id).map((f) => `${f.severity} ${f.in}:${f.file}:${f.line} ${f.key}`);
  assert.deepEqual(found("ae.rtl.dir-matches-lang"), ["warning output:about/index.html:2 html", "warning output:guide/index.html:2 html"]);
  // Isolated runs (bdi, dir, FSI and PDI), titles inside svg, and body text are not reported.
  assert.deepEqual(found("ae.rtl.bidi-isolated"), [
    "warning output:guide/index.html:4 title",
    "warning source:pages/index.md:2 title",
    "warning output:index.html:11 a",
    "warning source:pages/index.md:6 h1",
  ]);
  assert.match(report.findings.find((f) => f.key === "a").message, /^nav link "دربارهٔ Slipway" mixes/);
});

test("HTML: nesting, lines, entities, and raw text", () => {
  const tree = parse('<!doctype html>\n<html lang="fa">\n<title>A &amp; <b></title>\n<nav><p><a href="/">x<bdi>y</bdi></a></p></nav><br>\n<script>if (a < b) "</nav>"</script><h1>z</h1></html>');
  const seen = [...walk(tree)].map(({ element, ancestors }) => `${element.name}@${element.line}<${ancestors.map((a) => a.name).join(">")}`);
  assert.deepEqual(seen, ["html@2<", "title@3<html", "nav@4<html", "p@4<html>nav", "a@4<html>nav>p", "bdi@4<html>nav>p>a", "br@4<html", "script@5<html", "h1@5<html"]);
  assert.deepEqual([...walk(tree)][1].element.children, [{ text: "A & <b>" }]);
});

const reportSchema = JSON.parse(readFileSync(join(repo, "spec/agent-editable/report.schema.json"), "utf8"));
const validateReport = new Ajv2020({ allErrors: true, strict: false }).compile(reportSchema);

// The official SARIF 2.1.0 schema, copied unchanged. It is draft-04; every keyword it uses means the same in
// draft-07, so only its `id` is renamed for Ajv. Formats are not checked: the package has no ajv-formats.
const sarifSchema = JSON.parse(readFileSync(here("sarif-schema-2.1.0.json"), "utf8"));
const { id: sarifId, $schema: _draft04, ...sarifRest } = sarifSchema;
const validateSarif = new Ajv({ allErrors: true, strict: false, validateFormats: false }).compile({ $id: sarifId, ...sarifRest });

/** A heading at another level (an error on a section) and a visible edit control (a warning on a page). */
function breakBuiltPages(dir) {
  edit(join(dir, "build/guide/index.html"), /h1/g, "h2");
  edit(join(dir, "build/index.html"), " hidden>", ">");
}
const sourcemapVariant = (t) => variant(t, breakBuiltPages);

test("report: json validates against the report schema, passing or failing", async (t) => {
  for (const report of [await run("conforming"), await run("invalid-front-matter"), await doctor(fixture("conforming")), await sourcemapVariant(t)]) {
    assert.ok(validateReport(report), JSON.stringify(validateReport.errors));
    assert.equal(report.generator, "unknown");
  }
  // examples/docs runs the Jekyll checks (level null, scope "jekyll"); the detect fixture is a detected Jekyll site.
  const withChecks = await doctor(join(repo, "examples/docs"));
  assert.ok(validateReport(withChecks), JSON.stringify(validateReport.errors));
  assert.ok(withChecks.tests.some((t) => t.scope === "jekyll"));
  assert.equal((await doctor(fixture("detect/jekyll"))).generator, "jekyll");
});

test("report: a finding on a built page names the Markdown file and the section's line", async (t) => {
  const report = await sourcemapVariant(t);
  const ids = report.findings.find((f) => f.id === "ae.sourcemap.ids");
  assert.deepEqual(
    { in: ids.in, file: ids.file, line: ids.line, output: ids.output, key: ids.key },
    { in: "source", file: "pages/guide.md", line: 6, output: { file: "guide/index.html" }, key: "getting-started" },
  );
  const control = report.findings.find((f) => f.id === "ae.edit-prompt.without-script");
  assert.deepEqual([control.in, control.file, control.line, control.output], ["source", "pages/index.md", undefined, { file: "index.html" }]);
  assert.equal(formatFinding(ids, { source: "/s", build: "/s/build" }).split(" ")[0].endsWith("/s/pages/guide.md:6"), true);
});

test("report: a finding on a built page the source map does not list stays in the output", () => {
  const site = { sourcemap: () => ({ data: { pages: [] } }), outputFile: () => null, isFile: () => true, source: "/s" };
  const finding = { in: "output", file: "extra.html", key: "x", message: "m" };
  assert.equal(locate(site, finding), finding);
});

test("sarif: the log validates against SARIF 2.1.0, with rule ids, levels, and source lines", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-sarif-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture("conforming"), dir, { recursive: true });
  breakBuiltPages(dir);
  const report = await doctor(dir, { build: join(dir, "build") });
  const sarif = toSarif(report, { source: dir, build: join(dir, "build") }, { cwd: dir });
  assert.ok(validateSarif(sarif), JSON.stringify(validateSarif.errors));
  const [run0] = sarif.runs;
  assert.equal(run0.tool.driver.rules.length, report.tests.length);
  const ids = run0.results.find((r) => r.ruleId === "ae.sourcemap.ids");
  assert.equal(ids.level, "error");
  assert.equal(run0.tool.driver.rules[ids.ruleIndex].id, "ae.sourcemap.ids");
  assert.deepEqual(ids.locations[0].physicalLocation, { artifactLocation: { uri: "pages/guide.md" }, region: { startLine: 6 } });
  assert.equal(run0.results.find((r) => r.ruleId === "ae.edit-prompt.without-script").level, "warning");
  const outside = toSarif(report, { source: dir, build: join(dir, "build") }, { cwd: join(dir, "build") });
  const moved = outside.runs[0].results.find((r) => r.ruleId === "ae.sourcemap.ids");
  assert.equal(moved.locations[0].physicalLocation.artifactLocation.uri, pathToFileURL(join(dir, "pages/guide.md")).href);
});

test("cli: --format sarif prints a valid log with paths from the current folder", () => {
  const dir = "packages/doctor/test/fixtures/invalid-front-matter";
  const result = cli("doctor", dir, "--build", `${dir}/build`, "--format", "sarif");
  assert.equal(result.status, 1, result.stderr);
  const sarif = JSON.parse(result.stdout);
  assert.ok(validateSarif(sarif), JSON.stringify(validateSarif.errors));
  assert.ok(sarif.runs[0].results.some((r) => r.locations?.[0].physicalLocation.artifactLocation.uri === `${dir}/pages/index.md`));
});
