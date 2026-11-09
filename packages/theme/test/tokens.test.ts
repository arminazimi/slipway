import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildCss, loadTokens, main, paths } from "../scripts/tokens.ts";

const names = { color: { canvas: { $value: "#fff", $extensions: { lateen: { dark: "#000" } } }, text: "#222" }, space: { "1": "0.25rem" } };

/** A temp tokens folder with `names.json` and the given group files. */
function folder(groups: Record<string, unknown> = {}, registry: unknown = names) {
  const dir = mkdtempSync(join(tmpdir(), "tokens-"));
  writeFileSync(join(dir, "names.json"), JSON.stringify(registry));
  for (const [group, body] of Object.entries(groups)) writeFileSync(join(dir, `${group}.json`), JSON.stringify(body));
  return dir;
}

test("the committed tokens.css is current and every semantic group is frozen in names.json", () => {
  const tokens = loadTokens();
  assert.equal(readFileSync(paths.css, "utf8"), buildCss(tokens));
  const groups = new Set([...tokens.keys()].map((n) => n.split("-")[0]));
  for (const group of ["color", "type", "space", "radius", "shadow", "motion", "state", "code"]) assert.ok(groups.has(group), group);
});

test("light and dark go through light-dark() and data-theme overrides", () => {
  const css = buildCss(loadTokens(folder()));
  assert.match(css, /--color-canvas: light-dark\(#fff, #000\);/);
  assert.match(css, /--color-text: #222;/);
  assert.match(css, /:root\[data-theme="dark"\] \{\n {2}color-scheme: dark;/);
  assert.match(css, /:root\[data-theme="light"\] \{\n {2}color-scheme: light;/);
});

test("a group file overrides values by name, and adding one needs no other edit", () => {
  const dir = folder({ space: { "1": { $value: "4px" } }, color: { text: { $value: "{color.canvas}" } } });
  const css = buildCss(loadTokens(dir));
  assert.match(css, /--space-1: 4px;/);
  assert.match(css, /--color-text: var\(--color-canvas\);/);
  assert.match(css, /--color-canvas: light-dark\(#fff, #000\);/);
});

test("a name missing from names.json is an error", () => {
  assert.throws(() => loadTokens(folder({ space: { "99": "1px" } })), /"space\.99" is not in names\.json/);
  assert.throws(() => loadTokens(folder({ elevation: { a: "1" } })), /"elevation" is not a group/);
  assert.throws(() => buildCss(loadTokens(folder({ color: { text: "{color.nope}" } }))), /unknown reference/);
});

test("a dark value outside the color groups is an error", () => {
  const bad = { space: { "1": { $value: "1px", $extensions: { lateen: { dark: "2px" } } } } };
  assert.throws(() => loadTokens(folder({}, bad)), /dark value/);
});

test("--check fails when tokens.css is stale or missing and passes after a build", () => {
  const dir = folder();
  const css = join(dir, "tokens.css");
  const run = (arg: string) => {
    process.exitCode = undefined;
    const log = console.log;
    const err = console.error;
    console.log = console.error = () => {};
    try {
      main([arg], { dir, css });
    } finally {
      console.log = log;
      console.error = err;
    }
    const code = process.exitCode;
    process.exitCode = undefined;
    return code;
  };
  assert.equal(run("--check"), 1, "missing");
  run("--write");
  assert.equal(run("--check"), undefined, "current");
  writeFileSync(css, `${readFileSync(css, "utf8")}/* edited */\n`);
  assert.equal(run("--check"), 1, "stale");
  rmSync(dir, { recursive: true });
});
