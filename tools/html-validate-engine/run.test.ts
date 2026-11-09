import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { Message } from "html-validate";
import { builtSite } from "../fixture-build/build.ts";
import { formatFinding, main, validateBuild, validator } from "./run.ts";

/** A temporary folder; every test that writes files uses one. */
function folder(t: { after: (fn: () => void) => void }): string {
  const dir = mkdtempSync(join(tmpdir(), "html-validate-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Runs a test with console output silenced, so a gate that reports a failure stays quiet in the test log. */
async function quiet<T>(fn: () => Promise<T>): Promise<T> {
  const [log, error, warn] = [console.log, console.error, console.warn];
  console.log = console.error = console.warn = () => {};
  try {
    return await fn();
  } finally {
    [console.log, console.error, console.warn] = [log, error, warn];
  }
}

/** A complete page with `body` as its content. */
function page(body: string): string {
  return `<!DOCTYPE html>\n<html lang="en">\n<head><title>Test</title></head>\n<body>${body}</body>\n</html>\n`;
}

/** Every message html-validate reports for one string. */
async function messages(html: string): Promise<readonly Message[]> {
  const report = await validator().validateString(html);
  return report.results.flatMap((result) => result.messages);
}

test("the config accepts the theme's custom elements", async () => {
  const html = page('<sl-component data-kind="callout"><sl-button type="button">Open</sl-button></sl-component>');
  assert.deepEqual(await messages(html), []);
});

test("the config still rejects an unknown element", async () => {
  const rules = (await messages(page("<bogus>Not an element</bogus>"))).map((message) => message.ruleId);
  assert.ok(rules.includes("no-unknown-elements"), rules.join(", "));
});

test("the config accepts a nested header but keeps the footer and main exclusions", async () => {
  assert.deepEqual(await messages(page("<header><header><h1>Title</h1></header></header>")), []);
  const footer = await messages(page("<header><footer>Not allowed</footer></header>"));
  assert.ok(footer.some((message) => message.ruleId === "element-permitted-content"));
});

test("the config allows both DOCTYPE and void-element styles", async () => {
  for (const html of [page("<p>Upper</p>"), page("<p>Lower</p>").replace("<!DOCTYPE html>", "<!doctype html>")]) {
    assert.deepEqual(await messages(html.replace("<head>", '<head><meta charset="utf-8">')), [], html);
  }
  const selfClosing = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Test</title></head><body><p>Self-closing</p></body></html>`;
  assert.deepEqual(await messages(selfClosing), []);
});

test("validateBuild reports one folder that is missing or has no pages", async (t) => {
  const missing = await validateBuild(join(tmpdir(), "slipway-html-validate-missing"));
  assert.ok(missing.problems[0]!.includes("does not exist"));

  const empty = folder(t);
  const none = await validateBuild(empty);
  assert.deepEqual(none.problems, [`${empty} has no HTML pages`]);
});

test("formatFinding names the file, line, column, message, and rule", () => {
  assert.equal(
    formatFinding({ page: "guide/index.html", line: 12, column: 3, ruleId: "no-dup-id", message: 'Duplicate ID "a"', severity: "error" }),
    'guide/index.html:12:3: Duplicate ID "a" (no-dup-id)',
  );
});

test("the docs fixture is valid and a deliberately broken copy of one of its pages fails", async (t) => {
  const docs = await builtSite("docs-site");
  const real = await validateBuild(docs);
  assert.deepEqual(real.problems, []);
  assert.ok(real.pages >= 500, `expected the docs fixture, found ${real.pages} pages`);
  assert.equal(real.errors, 0);

  const copy = join(folder(t), "site");
  mkdirSync(copy);
  const source = readFileSync(join(docs, "index.html"), "utf8");
  writeFileSync(join(copy, "index.html"), source.replace("</body>", '<div id="duplicate"></div><div id="duplicate"></div></body>'));

  const broken = await validateBuild(copy);
  assert.deepEqual(broken.problems, []);
  assert.ok(broken.errors > 0);
  assert.ok(broken.findings.some((finding) => finding.page === "index.html" && finding.ruleId === "no-dup-id"));

  assert.equal(await quiet(() => main([copy])), 1, "the gate fails the broken copy");
});

test("the gate passes a real fixture build", async () => {
  const rtl = await builtSite("rtl-site");
  assert.equal(await quiet(() => main([rtl])), 0);
});
