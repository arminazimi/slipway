// Builds the minimal example site with the GitHub Pages gem, in one of three modes:
//   gem       theme: slipway-theme from the local gemspec (the Gemfile)
//   template  the theme files live in the site, as after "Use this template"
//   remote    remote_theme: arminazimi/slipway, fetched from GitHub (needs network)
// Usage: node tools/theme/build.mjs <gem|template|remote> [outDir]
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const modes = ["gem", "template", "remote"];
const example = join(root, "examples/minimal");
const themeDirs = ["_layouts", "_includes", "_sass", "assets"];

export function bundleAvailable() {
  return spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" }).status === 0;
}

export function buildExample(mode, out) {
  if (!modes.includes(mode)) throw new Error(`mode must be one of ${modes.join(", ")}`);
  let source = example;
  const configs = [join(example, "_config.yml")];

  if (mode === "template") {
    source = mkdtempSync(join(realpathSync(tmpdir()), "slipway-template-"));
    cpSync(example, source, { recursive: true });
    for (const dir of themeDirs) if (existsSync(join(root, dir))) cpSync(join(root, dir), join(source, dir), { recursive: true });
    const config = readFileSync(join(example, "_config.yml"), "utf8").replace(/^theme:.*\n/m, "");
    writeFileSync(join(source, "_config.yml"), config);
    configs[0] = join(source, "_config.yml");
  }
  if (mode === "remote") configs.push(join(example, "_config.remote.yml"));

  rmSync(out, { recursive: true, force: true });
  mkdirSync(dirname(out), { recursive: true });
  const result = spawnSync(
    "bundle",
    ["exec", "jekyll", "build", "--source", source, "--destination", out, "--config", configs.join(",")],
    {
      cwd: root,
      encoding: "utf8",
      // jekyll-github-metadata runs on every Pages build and wants a repository; the theme
      // stylesheet fails to build without a UTF-8 locale (ADR 0006).
      env: { ...process.env, PAGES_REPO_NWO: "arminazimi/slipway", LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8", JEKYLL_ENV: "production" },
    },
  );
  if (mode === "template") rmSync(source, { recursive: true, force: true });
  if (result.status !== 0) throw new Error(`jekyll build (${mode}) failed:\n${result.stdout}\n${result.stderr}`);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] ?? "gem";
  const out = resolve(process.argv[3] ?? join(root, "_site", mode));
  buildExample(mode, out);
  console.log(`built ${mode} → ${out}`);
}
