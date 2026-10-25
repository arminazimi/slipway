// Builds an example site (minimal by default) with the GitHub Pages gem, in one of three modes:
//   gem       theme: slipway-theme from the local gemspec (the Gemfile)
//   template  the theme files live in the site, as after "Use this template"
//   remote    remote_theme: arminazimi/slipway, fetched from GitHub (needs network)
// Usage: node tools/theme/build.mjs <gem|template|remote> [outDir] [example]
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
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

export function bundleAvailable() {
  return spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" }).status === 0;
}

/** Builds examples/<name>, or the site at `name` when it is an absolute path (a test fixture). */
export function buildExample(mode, out, name = "minimal") {
  const example = isAbsolute(name) ? name : join(root, "examples", name);
  if (!existsSync(example)) throw new Error(`no example site named ${name}`);
  if (!modes.includes(mode)) throw new Error(`mode must be one of ${modes.join(", ")}`);
  let source = example;
  const configs = [join(example, "_config.yml")];

  const original = readFileSync(join(example, "_config.yml"), "utf8");
  // A site that names only remote_theme (examples/bare) builds against this checkout in gem mode, not GitHub's copy.
  const remoteOnly = mode === "gem" && /^remote_theme:/m.test(original);
  if (mode === "template" || remoteOnly) {
    source = mkdtempSync(join(realpathSync(tmpdir()), `slipway-${mode}-`));
    cpSync(example, source, { recursive: true });
    // force: false keeps the site's own files, so an override slot the example fills wins, as it does after "Use this template".
    if (mode === "template") for (const dir of themeDirs) if (existsSync(join(root, dir))) cpSync(join(root, dir), join(source, dir), { recursive: true, force: false });
    const config = remoteOnly ? original.replace(/^remote_theme:.*$/m, "theme: slipway-theme") : original.replace(/^(remote_)?theme:.*\n/gm, "");
    writeFileSync(join(source, "_config.yml"), config);
    configs[0] = join(source, "_config.yml");
  }
  if (mode === "remote" && existsSync(join(example, "_config.remote.yml"))) configs.push(join(example, "_config.remote.yml"));

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
      env: { ...process.env, PAGES_REPO_NWO: "arminazimi/slipway", LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8", JEKYLL_ENV: "production" },
    },
  );
  if (source !== example) rmSync(source, { recursive: true, force: true });
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
