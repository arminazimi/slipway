// Builds an example site (minimal by default) with the GitHub Pages gem, in one of three modes:
//   gem       theme: slipway-theme from the local gemspec (the Gemfile)
//   template  the theme files live in the site, as after "Use this template"
//   remote    remote_theme: arminazimi/slipway, fetched from GitHub (needs network)
// Usage: node tools/theme/build.mjs <gem|template|remote> [outDir] [example]
//
// The Jekyll comes from BUNDLE_GEMFILE, as with any `bundle exec`: the root Gemfile (the GitHub Pages
// gem, Jekyll 3.10) by default, or tools/theme/gemfiles/jekyll4.gemfile for plain Jekyll 4.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const modes = ["gem", "template", "remote"];
/** Names of the example sites under examples/, each a folder with a _config.yml. */
export function exampleNames() {
  const dir = join(root, "examples");
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "_config.yml")))
    .map((entry) => entry.name)
    .sort();
}
const themeDirs = ["_layouts", "_includes", "_sass", "assets"];

/** The two Jekyll environments Slipway supports, each a Gemfile with its lockfile next to it. */
export const gemfiles = {
  pages: join(root, "Gemfile"),
  jekyll4: join(root, "tools/theme/gemfiles/jekyll4.gemfile"),
};
// Outside GitHub Pages nothing sets `url` (jekyll-github-metadata does on Pages), and feeds and
// sitemaps need absolute addresses, so a Jekyll 4 build gets one the way a real site sets it.
const jekyll4Config = join(root, "tools/theme/gemfiles/jekyll4.config.yml");

/** Which entry of `gemfiles` a BUNDLE_GEMFILE value selects; unset means the Pages gem. */
export function target(gemfile = process.env.BUNDLE_GEMFILE) {
  return gemfile && resolve(root, gemfile) === gemfiles.jekyll4 ? "jekyll4" : "pages";
}

function bundleEnv(gemfile) {
  return gemfile ? { ...process.env, BUNDLE_GEMFILE: resolve(root, gemfile) } : process.env;
}

export function bundleAvailable(gemfile = process.env.BUNDLE_GEMFILE) {
  return spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8", env: bundleEnv(gemfile) }).status === 0;
}

/** Builds one example. `gemfile` picks the Jekyll (default: BUNDLE_GEMFILE); `configs` are extra overlays. */
export function buildExample(mode, out, name = "minimal", { gemfile = process.env.BUNDLE_GEMFILE, configs: overlays = [] } = {}) {
  const example = join(root, "examples", name);
  if (!existsSync(example)) throw new Error(`no example site named ${name}`);
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
  if (target(gemfile) === "jekyll4") configs.push(jekyll4Config);
  configs.push(...overlays);

  rmSync(out, { recursive: true, force: true });
  mkdirSync(dirname(out), { recursive: true });
  const result = spawnSync(
    "bundle",
    ["exec", "jekyll", "build", "--source", source, "--destination", out, "--baseurl", "", "--config", configs.join(",")],
    {
      cwd: root,
      encoding: "utf8",
      // jekyll-github-metadata runs on every Pages build and wants a repository (it also sets a
      // baseurl, which --baseurl "" above clears so the site can be checked from its root); the theme
      // stylesheet fails to build without a UTF-8 locale (ADR 0006).
      env: { ...bundleEnv(gemfile), PAGES_REPO_NWO: "arminazimi/slipway", LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8", JEKYLL_ENV: "production" },
    },
  );
  if (mode === "template") rmSync(source, { recursive: true, force: true });
  if (result.status !== 0) throw new Error(`jekyll build (${mode}) failed:\n${result.stdout}\n${result.stderr}`);
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] ?? "gem";
  const name = process.argv[4] ?? "minimal";
  const out = resolve(process.argv[3] ?? join(root, "_site", mode));
  buildExample(mode, out, name);
  console.log(`built ${mode} → ${out}`);
}
