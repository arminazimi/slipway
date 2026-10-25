import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { configProblems, exampleSites, formatProblem, main, validateSite } from "./validate.mjs";
import { root } from "./tokens.mjs";

/** A temporary site folder with the given files. */
function site(files) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-validate-"));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

test("every example site validates", () => {
  assert.ok(exampleSites().length >= 4);
  for (const dir of exampleSites()) assert.deepEqual(validateSite(dir, root).map(formatProblem), [], dir);
});

test("front matter problems name the file, line, key, and allowed values", () => {
  const dir = site({
    "_posts/2026-01-01-a.md": "---\ntitle: Hi\ndirection: up\n---\nbody\n",
    "b.md": "---\ndescription: no title\n---\n",
    "c.md": "---\ntitle: [oops\n---\n",
    "plain.md": "no front matter\n",
  });
  assert.deepEqual(validateSite(dir, dir).map(formatProblem), [
    "_posts/2026-01-01-a.md:3 direction: must be equal to one of the allowed values (allowed: ltr, rtl)",
    "b.md:2 title: is required",
    "c.md:2 /: YAML does not parse: Flow sequence in block collection must be sufficiently indented and end with a ]",
  ]);
});

test("config problems name the line and the dotted key path", () => {
  const dir = site({
    "_config.yml": "title: X\ndirection: up\nslipway:\n  languags: []\n  languages:\n    - code: en\n      name: English\n",
  });
  const problems = validateSite(dir, dir);
  assert.deepEqual(
    problems.map(({ file, line, key }) => `${file}:${line} ${key}`),
    ["_config.yml:2 direction", "_config.yml:4 slipway.languags", "_config.yml:6 slipway.languages.0.prefix"],
  );
  assert.deepEqual(problems[0].allowed, ["ltr", "rtl"]);
  assert.ok(problems[1].allowed.includes("languages"));
});

test("a pattern error offers the first sentence of the key's description", () => {
  const [problem] = configProblems({ lang: "EN" });
  assert.equal(problem.key, "lang");
  assert.deepEqual(problem.allowed, ["Default language of the site as a BCP 47 tag."]);
});

test("main returns an exit code instead of exiting", () => {
  const lines = [];
  const sink = { log: (line) => lines.push(line), error: (line) => lines.push(line) };
  assert.equal(main([], sink), 0);
  const bad = site({ "index.md": "---\nlang: 5\n---\n" });
  assert.equal(main([bad], sink), 1);
  assert.ok(lines.some((line) => line.includes("index.md:2 lang:")), lines.join("\n"));
});

test("the CLI exits 1 on an invalid page", () => {
  const bad = site({ "index.md": "---\ntitle: Hi\ndir: up\n---\n" });
  const result = spawnSync(process.execPath, [join(root, "tools/theme/validate.mjs"), "."], { cwd: bad, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^index\.md:3 dir: .*\(allowed: ltr, rtl\)$/m);
});
