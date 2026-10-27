import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdtempSync, mkdirSync, readdirSync, statSync } from "node:fs";
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
  console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` or `npx playwright install --with-deps` to run anchor tests.");
  process.exit(0);
}

// Ensure Ruby and bundle are available because we need to build the site to test it.
const jekyllCheck = spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" });
if (jekyllCheck.status !== 0) {
  console.log("SKIP: Ruby and `bundle install` are required to build the site for anchor tests.");
  process.exit(0);
}

const outDir = mkdtempSync(join(tmpdir(), "slipway-anchors-"));

function getAllHtmlFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      getAllHtmlFiles(filePath, fileList);
    } else if (filePath.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

try {
  console.log("Building example sites for anchor tests...");
  const builtPages = {};
  for (const name of exampleNames()) {
    const siteOut = join(outDir, name);
    mkdirSync(siteOut, { recursive: true });
    buildExample("gem", siteOut, name);

    const htmlFiles = getAllHtmlFiles(siteOut);
    for (const file of htmlFiles) {
      // Relative path to identify the page, e.g. "minimal/index.html"
      const relativePath = file.substring(outDir.length + 1);
      builtPages[relativePath] = `file://${file}`;
    }
  }

  process.env.BUILT_PAGES = JSON.stringify(builtPages);

  console.log("Running Playwright anchor tests...");
  const result = spawnSync("node", ["--test", "tools/anchors/anchors.test.mjs"], {
    stdio: "inherit",
    shell: true,
    cwd: root,
  });

  if (result.status !== 0) {
    process.exitCode = result.status;
  }
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
