import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  analyze,
  buildFixture,
  checkCode,
  checkDirection,
  checkIcons,
  checkLogical,
  htmlAttributes,
  readPages,
  readStylesheets,
  root,
  type PageSource,
  type Stylesheet,
} from "./run.ts";

/** A minimal built page with the given `<html>` attributes. */
function page(attributes: string, body = "<p>text</p>"): PageSource {
  return { file: "index.html", html: `<!DOCTYPE html><html ${attributes}><body>${body}</body></html>` };
}

/** A stylesheet with a synthetic path. */
function sheet(file: string, css: string): Stylesheet {
  return { file, css };
}

/** The theme's right-to-left stylesheet, with the rule every code block needs. */
const CODE_RULE = ":where(pre, code, kbd):lang(fa) {\n  direction: ltr;\n  unicode-bidi: isolate;\n}";

test("htmlAttributes reads the direction and language in any order", () => {
  assert.deepEqual(htmlAttributes('<html lang="fa" dir="rtl" data-theme="dark">'), {
    lang: "fa",
    dir: "rtl",
    "data-theme": "dark",
  });
  assert.deepEqual(htmlAttributes("<html dir='rtl' lang='fa'>"), { dir: "rtl", lang: "fa" });
  assert.equal(htmlAttributes("<p>no document shell</p>"), undefined);
});

test("the direction check requires dir=rtl and the config's language on every page", () => {
  assert.deepEqual(checkDirection([page('lang="fa" dir="rtl"')], "fa"), []);
  assert.deepEqual(checkDirection([page('lang="fa-IR" dir="rtl"')], "fa").length, 1);
  assert.equal(checkDirection([page('lang="fa" dir="ltr"')], "fa").length, 1);
  assert.equal(checkDirection([page('lang="en" dir="rtl"')], "fa").length, 1);
  assert.equal(checkDirection([{ file: "index.html", html: "<p>no shell</p>" }], "fa").length, 1);
  assert.equal(checkDirection([], "fa").length, 1);
});

test("the code check needs a code block and a left-to-right rule for pre, code, and kbd", () => {
  const code = page('lang="fa" dir="rtl"', "<pre><code>beacon deploy</code></pre>");
  const rtl = sheet("packages/theme/styles/rtl.css", CODE_RULE);

  assert.deepEqual(checkCode([code], [rtl]).findings, []);
  assert.equal(checkCode([code], [rtl]).codePages, 1);

  const noBlock = page('lang="fa" dir="rtl"', "<p>only prose</p>");
  assert.equal(checkCode([noBlock], [rtl]).findings.length, 1);

  const noRule = sheet("packages/theme/styles/rtl.css", ":where(pre, code, kbd) { font-family: monospace; }");
  assert.equal(checkCode([code], [noRule]).findings.length, 3);

  assert.equal(checkCode([code], []).findings.length, 1);
});

test("the icon check reports a mirrored icon and rejects a hardcoded or missing mechanism", () => {
  const mirrored = checkIcons([
    sheet(
      "packages/theme/components/next/style.css",
      ".next-arrow {\n  inline-size: 1rem;\n}\n\n[dir=\"rtl\"] .next-arrow {\n  transform: scaleX(-1);\n}",
    ),
  ]);
  assert.deepEqual(mirrored.findings, []);
  assert.equal(mirrored.icons.length, 1);
  assert.match(mirrored.icons[0]!.mechanism, /^mirror: .*transform: scaleX\(-1\)/);

  const pinned = checkIcons([sheet("packages/theme/components/next/style.css", ".next-arrow { margin-left: 1rem; }")]);
  assert.ok(pinned.findings.some((finding) => /physical property/.test(finding.message)));

  const unmirrored = checkIcons([sheet("packages/theme/components/next/style.css", ".next-arrow { inline-size: 1rem; }")]);
  assert.equal(unmirrored.findings.length, 1);
  assert.match(unmirrored.findings[0]!.message, /no directional icon mirrors/);

  const logical = checkIcons([
    sheet(
      "packages/theme/components/next/style.css",
      ".previous-arrow { inline-size: 1rem; }\n[dir=\"rtl\"] .previous-arrow { transform: scaleX(-1); }\n.next-arrow { padding-inline-start: 1rem; }",
    ),
  ]);
  assert.deepEqual(logical.findings, []);
  assert.ok(logical.icons.some((icon) => icon.selector === ".next-arrow" && icon.mechanism.startsWith("logical:")));
});

test("the logical check flags physical properties and accepts logical ones", () => {
  assert.equal(checkLogical([sheet("packages/theme/styles/a.css", "a { margin-left: 1rem; }")]).length, 1);
  assert.equal(checkLogical([sheet("packages/theme/styles/a.css", "a { text-align: right; }")]).length, 1);
  assert.deepEqual(checkLogical([sheet("packages/theme/styles/a.css", "a { margin-inline-start: 1rem; text-align: end; }")]), []);
  assert.equal(checkLogical([]).length, 1);
});

test("the gate passes on the rtl fixture and fails on a broken copy of it", async (t) => {
  const fixture = await buildFixture();
  t.after(async () => fixture.cleanup());

  const pages = readPages(fixture.buildDir);
  const stylesheets = readStylesheets(join(root, "packages/theme"));
  assert.equal(fixture.lang, "fa");
  assert.ok(pages.length >= 4, "the fixture should build its pages");

  const result = analyze({ pages, stylesheets, lang: fixture.lang });
  assert.deepEqual(result.findings, []);
  assert.ok(result.codePages >= 1, "the fixture should render a code block");
  assert.ok(result.icons.length >= 3, "the theme should draw directional icons");
  assert.ok(result.icons.some((icon) => icon.mechanism.startsWith("mirror:")), "an icon should mirror under dir=rtl");

  // The same build with the direction flipped: the direction check fails.
  const flipped = pages.map((source) => ({ ...source, html: source.html.replace('dir="rtl"', 'dir="ltr"') }));
  const flippedResult = analyze({ pages: flipped, stylesheets, lang: fixture.lang });
  assert.ok(flippedResult.findings.some((finding) => finding.check === "direction"));

  // The same theme with a physical property: the logical check fails.
  const physical = [...stylesheets, sheet("packages/theme/styles/broken.css", "a { margin-left: 1rem; }")];
  assert.ok(analyze({ pages, stylesheets: physical, lang: fixture.lang }).findings.some((finding) => finding.check === "logical"));

  // The same theme without the code rule: the code check fails.
  const noCodeRule = stylesheets.map((source) =>
    source.file.endsWith("/styles/rtl.css") ? { ...source, css: source.css.replace(/direction:\s*ltr;/g, "") } : source,
  );
  assert.ok(analyze({ pages, stylesheets: noCodeRule, lang: fixture.lang }).findings.some((finding) => finding.check === "code"));
});

test("a missing fixture is a clear error", async (t) => {
  const empty = mkdtempSync(join(tmpdir(), "slipway-rtl-empty-"));
  t.after(() => rmSync(empty, { recursive: true, force: true }));
  await assert.rejects(buildFixture({ repo: empty }), /fixtures\/rtl-site does not exist/);
});
