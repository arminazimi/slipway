import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExample, exampleNames } from "../theme/build.mjs";

const root = join(fileURLToPath(import.meta.url), "../../..");

let playwrightDir;
if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");

if (!existsSync(playwrightDir) && !process.env.PLAYWRIGHT_BROWSERS_PATH && !process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
  console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` to run page-weight tests.");
  process.exit(0);
}

const jekyllCheck = spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" });
if (jekyllCheck.status !== 0) {
  console.log("SKIP: Ruby and `bundle install` are required to build the site for page-weight tests.");
  process.exit(0);
}

const outDirs = [];
const siteUrls = {};

try {
  console.log("Building example sites for page-weight tests...");
  for (const name of exampleNames()) {
    const outDir = mkdtempSync(join(tmpdir(), `slipway-page-weight-${name}-`));
    outDirs.push(outDir);
    buildExample("gem", outDir, name);
    siteUrls[name] = `file://${outDir}/`;
  }

  // We need to test deliberate failing fixture, which issue 509 explicitly states
  // "It fails on a deliberately broken fixture and passes on the examples."
  const brokenDir = mkdtempSync(join(tmpdir(), `slipway-page-weight-broken-`));
  outDirs.push(brokenDir);
  mkdirSync(brokenDir, { recursive: true });
  const heavyFile = join(brokenDir, 'index.html');
  const hugeString = 'a'.repeat(200000); // 200KB
  writeFileSync(heavyFile, `<html><body>${hugeString}</body></html>`);
  siteUrls['broken-fixture'] = `file://${brokenDir}/index.html`;

  console.log("Running Playwright page-weight tests...");
  const result = spawnSync("npx", ["playwright", "test", "--config=tools/page-weight/playwright.config.js"], {
    stdio: "inherit",
    shell: true,
    cwd: root,
    env: { ...process.env, SITE_URLS: JSON.stringify(siteUrls) }
  });

  if (result.status !== 0) {
    process.exitCode = result.status;
  }
} finally {
  for (const outDir of outDirs) {
    rmSync(outDir, { recursive: true, force: true });
  }
}
