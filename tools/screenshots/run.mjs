import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExample } from "../theme/build.mjs";

const root = join(fileURLToPath(import.meta.url), "../../..");

// Check if playwright browsers are available.
let playwrightDir;
if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");

if (!existsSync(playwrightDir)) {
  console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` or `npx playwright install --with-deps` to run screenshot tests.");
  process.exit(0);
}

// Ensure Ruby and bundle are available because we need to build the site to test it.
const jekyllCheck = spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" });
if (jekyllCheck.status !== 0) {
  console.log("SKIP: Ruby and `bundle install` are required to build the site for Playwright tests.");
  process.exit(0);
}

// Build the minimal and persian sites to a temp directory
const outDir = mkdtempSync(join(tmpdir(), "slipway-screenshots-"));
try {
  console.log("Building sites for screenshot tests...");
  const minimalOutDir = join(outDir, "minimal");
  const persianOutDir = join(outDir, "persian");
  buildExample("gem", minimalOutDir, "minimal");
  buildExample("gem", persianOutDir, "persian");

  console.log("Running Playwright screenshot tests...");
  const result = spawnSync("npx", ["playwright", "test", "--config=tools/screenshots/playwright.config.js"], {
    stdio: "inherit",
    shell: true,
    cwd: root,
    env: {
      ...process.env,
      MINIMAL_SITE_URL: `file://${minimalOutDir}/index.html`,
      PERSIAN_SITE_URL: `file://${persianOutDir}/index.html`
    }
  });

  if (result.status !== 0) {
    process.exitCode = result.status;
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
