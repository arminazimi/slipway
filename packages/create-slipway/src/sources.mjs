// Where the files a new site starts from come from. In the repository they are read in place:
// examples/bare (the starter), starter-files/ (the stubs every site copies, when that folder
// exists), and the theme folders for template mode. The published package carries the same files
// in template/, written by scripts/bundle.mjs.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const themeDirs = ["_layouts", "_includes", "_sass", "assets"];

/** Files of the starter that the CLI writes itself instead of copying. */
const generated = new Set(["_config.yml", "Gemfile", "Gemfile.lock"]);
/** Files of starter-files/ that document the folder and do not belong in a site. */
const stubDocs = new Set(["README.md"]);

/** The sources in a checkout of the repository. */
export function repoSources(repo = resolve(packageRoot, "../..")) {
  return {
    starter: join(repo, "examples/bare"),
    stubs: join(repo, "starter-files"),
    theme: join(repo),
  };
}

/** The sources inside the published package. */
export function bundledSources(base = join(packageRoot, "template")) {
  return { starter: join(base, "starter"), stubs: join(base, "stubs"), theme: join(base, "theme") };
}

/** The bundled sources when the package carries them, else the repository's. */
export function findSources() {
  const bundled = bundledSources();
  return existsSync(bundled.starter) ? bundled : repoSources();
}

/** Copies every file of `from` into `to`, except the names in `skip` at the top level. */
function copyTop(from, to, skip) {
  if (!existsSync(from)) return [];
  mkdirSync(to, { recursive: true });
  const copied = [];
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    cpSync(join(from, entry.name), join(to, entry.name), { recursive: true });
    copied.push(entry.name);
  }
  return copied;
}

/** Copies the starter and the stubs into a new site. Template mode also gets the theme folders. */
export function copyStarter(sources, site, { theme = false } = {}) {
  if (!existsSync(sources.starter)) throw new Error(`the starter is missing: ${sources.starter}`);
  const copied = [...copyTop(sources.starter, site, generated), ...copyTop(sources.stubs, site, stubDocs)];
  if (theme) {
    for (const dir of themeDirs) {
      if (!existsSync(join(sources.theme, dir))) continue;
      cpSync(join(sources.theme, dir), join(site, dir), { recursive: true });
      copied.push(dir);
    }
  }
  return copied.sort();
}

/** Writes the sources into the package layout of bundledSources(). */
export function copySources(sources, out) {
  const target = bundledSources(out);
  if (!existsSync(sources.starter)) throw new Error(`the starter is missing: ${sources.starter}`);
  copyTop(sources.starter, target.starter, new Set());
  copyTop(sources.stubs, target.stubs, new Set());
  for (const dir of themeDirs) {
    if (existsSync(join(sources.theme, dir))) cpSync(join(sources.theme, dir), join(target.theme, dir), { recursive: true });
  }
}
