// The deployed docs site lives under /slipway/ (project Pages), so a build that drops the base URL
// ships links to /assets/... that 404 (issue #698). Two checks: the workflow takes the base URL
// from Pages, and the site and /spec/ built with that base URL link only below it.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildExample, bundleAvailable, root } from "../theme/build.mjs";

const baseurl = "/slipway";

test("deploy-site.yml builds with the base URL Pages reports", () => {
  const workflow = readFileSync(join(root, ".github/workflows/deploy-site.yml"), "utf8");
  assert.doesNotMatch(workflow, /--baseurl\s+(""|'')/, 'deploy-site.yml must not build with --baseurl ""');
  assert.match(workflow, /actions\/configure-pages@/, "deploy-site.yml must run actions/configure-pages");
  const builds = workflow.match(/jekyll build[^\n]*/g) ?? [];
  assert.equal(builds.length, 2, "one Jekyll build for the site and one for /spec/");
  for (const line of builds) assert.match(line, /--baseurl\s+"?\$\{\{\s*steps\.pages\.outputs\.base_path\s*\}\}/, `build line lacks the Pages base_path: ${line}`);
});

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
    .map((entry) => join(entry.parentPath, entry.name));
}

test("the docs site and /spec/ link only below the base URL", { skip: bundleAvailable() ? false : "bundle not available" }, () => {
  // spec/docs-site is generated, so it is absent on a fresh checkout.
  execFileSync(process.execPath, [join(root, "tools/spec/build.mjs")], { cwd: root, stdio: "ignore" });
  const work = mkdtempSync(join(tmpdir(), "slipway-pages-baseurl-"));
  try {
    const sites = [
      ["site", join(root, "site"), baseurl],
      ["spec", join(root, "spec/docs-site"), `${baseurl}/spec`],
    ];
    for (const [label, source, base] of sites) {
      const out = buildExample("gem", join(work, label), source, { baseurl: base });
      const files = htmlFiles(out);
      assert.ok(files.length > 0, `${label}: no pages built`);
      for (const file of files) {
        const html = readFileSync(file, "utf8").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
        for (const [, attr, value] of html.matchAll(/\s(href|src)="(\/(?!\/)[^"]*)"/g)) {
          assert.ok(value === base || value.startsWith(`${base}/`) || value.startsWith(`${baseurl}/`), `${label}: ${file.slice(out.length)} has ${attr}="${value}" outside ${base}`);
        }
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
