// `npm run sourcemap`: level 1 of ADR 0007. Writes <site>/sourcemap.json with exact lines for a
// classic-Pages site, using the code of the Actions plugin (_plugins/slipway_sourcemap.rb) and the
// kramdown of the GitHub Pages gem. Needs Ruby and `bundle install`.
//   node tools/sourcemap/run.mjs [site]            write the map (site defaults to .)
//   node tools/sourcemap/run.mjs [site] --check    fail when the committed map is missing or stale
// A written map replaces the level 0 stub page of the same name.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { root } from "../theme/build.mjs";
import { validateSourcemap } from "../theme/sourcemap.mjs";

/** The map of a site source folder, as the JSON text the plugin writes. Throws when Ruby fails. */
export function generateSourcemap(site) {
  const result = spawnSync("bundle", ["exec", "ruby", join(root, "tools/sourcemap/sourcemap.rb"), resolve(site)], {
    cwd: root,
    encoding: "utf8",
    // The GitHub Pages gem loads jekyll-github-metadata, which wants a repository, and kramdown wants UTF-8 (ADR 0006).
    env: { PAGES_REPO_NWO: "arminazimi/slipway", ...process.env, LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8" },
  });
  if (result.status !== 0) throw new Error(`sourcemap failed:\n${result.stdout}${result.stderr}`);
  return result.stdout;
}

export function main(args = process.argv.slice(2)) {
  const check = args.includes("--check");
  const site = args.find((arg) => !arg.startsWith("--")) ?? ".";
  const text = generateSourcemap(site);
  const { ok, errors } = validateSourcemap(JSON.parse(text));
  if (!ok) throw new Error(`the generated map does not validate:\n${errors.join("\n")}`);
  const file = join(site, "sourcemap.json");
  if (check) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== text) {
      console.error(`FAIL: ${file} is missing or stale; run \`npm run sourcemap -- ${site}\` and commit it`);
      process.exitCode = 1;
    } else console.log(`OK: ${file} is up to date`);
    return;
  }
  writeFileSync(file, text);
  console.log(`wrote ${file}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
