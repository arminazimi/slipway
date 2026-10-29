import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, readdirSync, cpSync, statSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExample, exampleNames, root } from "../theme/build.mjs";

export function pseudoLoc(str) {
  if (str.length === 0) return str;
  let i = 0;
  let res = "";
  let textChars = 0;

  const accents = {
    a: "á", e: "é", i: "í", o: "ó", u: "ú",
    A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú",
  };

  while (i < str.length) {
    if (str[i] === '{' && i + 2 < str.length && str.indexOf('}', i) !== -1) {
      let end = str.indexOf('}', i);
      let content = str.substring(i + 1, end);
      if (content === 'n' || content === 'source' || content === 'text' || content === 'total') {
        res += str.substring(i, end + 1);
        i = end + 1;
        continue;
      }
    }
    res += accents[str[i]] || str[i];
    if (str[i] !== ' ') textChars++;
    i++;
  }

  const extension = Math.max(1, Math.ceil(textChars * 0.4));
  return res + "x".repeat(extension);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let playwrightDir;
  if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
  else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
  else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");

  if (!existsSync(playwrightDir)) {
    console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` or `npx playwright install --with-deps` to run pseudo-loc tests.");
    process.exit(0);
  }

  const jekyllCheck = spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" });
  if (jekyllCheck.status !== 0) {
    console.log("SKIP: Ruby and `bundle install` are required to build the site for pseudo-loc tests.");
    process.exit(0);
  }

  try {
    await import("@playwright/test");
  } catch (e) {
    console.log("SKIP: @playwright/test is not installed. Run `npm install`.");
    process.exit(0);
  }

  const outDir = mkdtempSync(join(tmpdir(), "slipway-pseudo-loc-"));
  const tmpRoot = mkdtempSync(join(tmpdir(), "slipway-pseudo-loc-root-"));

  const originalI18nDir = join(root, "_includes/i18n");
  const backupI18nDir = join(tmpRoot, "i18n-backup");
  mkdirSync(backupI18nDir, { recursive: true });

  try {
    console.log("Building example sites for pseudo-loc tests...");

    // Backup and modify i18n files
    for (const file of readdirSync(originalI18nDir)) {
      const src = join(originalI18nDir, file);
      if (statSync(src).isFile() && src.endsWith(".html")) {
        cpSync(src, join(backupI18nDir, file));

        let html = readFileSync(src, "utf8");
        html = html.replace(/({%- when \x27[^\x27]+\x27 -%})(.*?)(?=\n{%-)/g, (match, prefix, content) => {
          return prefix + pseudoLoc(content);
        });
        writeFileSync(src, html);
      }
    }

    const siteUrls = {};
    for (const name of exampleNames()) {
      const siteOut = join(outDir, name);
      buildExample("gem", siteOut, name);
      siteUrls[name] = `file://${siteOut}/index.html`;
    }

    // Restore i18n files before running playwright to ensure we don't leave them modified
    for (const file of readdirSync(backupI18nDir)) {
      cpSync(join(backupI18nDir, file), join(originalI18nDir, file));
    }
    rmSync(backupI18nDir, { recursive: true, force: true });

    console.log("Running Playwright pseudo-loc tests...");
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
    if (existsSync(backupI18nDir)) {
      for (const file of readdirSync(backupI18nDir)) {
        cpSync(join(backupI18nDir, file), join(originalI18nDir, file));
      }
    }
    rmSync(outDir, { recursive: true, force: true });
    rmSync(tmpRoot, { recursive: true, force: true });
  }
}
