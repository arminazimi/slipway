import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExample, exampleNames } from "../theme/build.mjs";

const root = join(fileURLToPath(import.meta.url), "../../..");

// Check if playwright browsers are available.
let playwrightDir;
if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");

if (!existsSync(playwrightDir)) {
  console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` or `npx playwright install --with-deps` to run a11y tests.");
  process.exit(0);
}

// Ensure Ruby and bundle are available because we need to build the site to test it.
const jekyllCheck = spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" });
if (jekyllCheck.status !== 0) {
  console.log("SKIP: Ruby and `bundle install` are required to build the site for a11y tests.");
  process.exit(0);
}

// Check for axe-core/playwright
try {
  await import("@axe-core/playwright");
} catch (e) {
  console.log("SKIP: @axe-core/playwright is not installed. Run `npm install`.");
  process.exit(0);
}

const outDirs = [];
const siteUrls = {};

try {
  console.log("Building example sites for a11y tests...");
  for (const name of exampleNames()) {
    const outDir = mkdtempSync(join(tmpdir(), `slipway-a11y-${name}-`));
    outDirs.push(outDir);
    buildExample("gem", outDir, name);
    siteUrls[name] = `file://${outDir}/index.html`;
  }

  console.log("Running Playwright a11y tests...");
  const result = spawnSync("npx", ["playwright", "test", "--config=tools/a11y/playwright.config.js"], {
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
