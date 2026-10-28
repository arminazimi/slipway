// `npm run twins`: the Markdown twins of a classic-Pages site (ADR 0006). Writes one stub page per
// Markdown source, `<name>.twin.html`, using the code of the Actions plugin (_plugins/slipway_twins.rb)
// and the GitHub Pages gem. Needs Ruby and `bundle install`.
//   node tools/twins/run.mjs [site]            write the stubs and delete stale ones (site defaults to .)
//   node tools/twins/run.mjs [site] --check    fail when a stub is missing, stale, or left over
// A stub is a file ending in .twin.html whose front matter has `twin_of`.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { root, bundleAvailable } from "../theme/build.mjs";

/** The stubs a site source folder needs, as { path: text }. Throws when Ruby fails. */
export function generateTwins(site) {
  if (!bundleAvailable()) {
    return {};
  }
  const result = spawnSync("bundle", ["exec", "ruby", join(root, "tools/twins/twins.rb"), resolve(site)], {
    cwd: root,
    encoding: "utf8",
    // The GitHub Pages gem loads jekyll-github-metadata, which wants a repository (ADR 0006).
    env: { PAGES_REPO_NWO: "arminazimi/slipway", ...process.env, LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8" },
  });
  if (result.status !== 0) throw new Error(`twins failed:\n${result.stdout}${result.stderr}`);
  return JSON.parse(result.stdout);
}

/** The stubs committed in a site, as relative paths. Skips _site, node_modules, and dot folders. */
export function committedTwins(site) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "_site" || entry.name === "node_modules") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".twin.html") && /^twin_of:/m.test(readFileSync(path, "utf8"))) found.push(relative(site, path).split(sep).join("/"));
    }
  };
  walk(site);
  return found.sort();
}

export function main(args = process.argv.slice(2)) {
  if (!bundleAvailable()) {
    console.log("SKIP: install Ruby and run bundle install to manage twins");
    return;
  }
  const check = args.includes("--check");
  const site = resolve(args.find((arg) => !arg.startsWith("--")) ?? ".");
  const stubs = generateTwins(site);
  const stale = committedTwins(site).filter((path) => !(path in stubs));
  if (check) {
    const problems = [
      ...Object.entries(stubs)
        .filter(([path, text]) => !existsSync(join(site, path)) || readFileSync(join(site, path), "utf8") !== text)
        .map(([path]) => `${path} is missing or stale`),
      ...stale.map((path) => `${path} has no source page any more`),
    ];
    if (problems.length) {
      console.error(`FAIL: Markdown twins of ${site}\n${problems.map((p) => `  ${p}`).join("\n")}\n  run \`npm run twins -- ${site}\` and commit the stubs`);
      process.exitCode = 1;
    } else console.log(`OK: ${Object.keys(stubs).length} Markdown twin stubs in ${site} are up to date`);
    return;
  }
  for (const [path, text] of Object.entries(stubs)) {
    mkdirSync(dirname(join(site, path)), { recursive: true });
    writeFileSync(join(site, path), text);
  }
  for (const path of stale) rmSync(join(site, path));
  console.log(`wrote ${Object.keys(stubs).length} Markdown twin stubs in ${site}${stale.length ? `, deleted ${stale.length}` : ""}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
