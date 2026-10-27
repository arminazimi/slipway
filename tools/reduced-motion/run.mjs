import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdtempSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
  console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` or `npx playwright install --with-deps` to run reduced-motion tests.");
  process.exit(0);
}

// Ensure Ruby and bundle are available because we need to build the site to test it.
const jekyllCheck = spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" });
if (jekyllCheck.status !== 0) {
  console.log("SKIP: Ruby and `bundle install` are required to build the site for reduced-motion tests.");
  process.exit(0);
}

const outDir = mkdtempSync(join(tmpdir(), "slipway-reduced-motion-"));

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
  console.log("Building example sites for reduced-motion tests...");
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

  // Create a deliberately broken fixture
  const fixturePath = join(outDir, "broken-fixture.html");
  writeFileSync(fixturePath, `<!DOCTYPE html>
<html>
<head>
  <style>
    .animated-box {
      width: 100px;
      height: 100px;
      background: red;
      transition: width 2s;
    }
    .animated-box:hover {
      width: 300px;
    }
    /* Deliberately overriding reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .animated-box {
        transition: width 2s !important;
      }
    }
  </style>
</head>
<body>
  <div class="animated-box"></div>
</body>
</html>`);

  process.env.BUILT_PAGES = JSON.stringify(builtPages);
  process.env.FIXTURE_URL = `file://${fixturePath}`;

  console.log("Running Playwright tests...");
  const result = spawnSync("npx", ["playwright", "test", "--config=tools/reduced-motion/playwright.config.js"], {
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
