// The site half of `npm run check`: validates schemas, builds every example site with the GitHub
// Pages gem in gem and template mode, and runs Seaworthy on each build.
//
//   SLIPWAY_REQUIRE_BUILD=1       fail instead of skipping when Ruby and `bundle install` are missing
//   SLIPWAY_REQUIRE_SEAWORTHY=1   fail instead of skipping when no Seaworthy CLI is found
//   SEAWORTHY_CLI=<path>          use this built Seaworthy CLI instead of the pinned one
//
// Without SEAWORTHY_CLI, Seaworthy is fetched from git at the commit in tools/seaworthy/pin.json
// (needs network on the first run).
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureSeaworthy } from "../seaworthy/setup.mjs";
import { bundleAvailable, buildExample, exampleNames, root } from "./build.mjs";
import { validateExampleConfigs } from "./config.mjs";
import { findDeprecations } from "./deprecations.mjs";
import { rtlChecks } from "../../packages/doctor/src/checks/rtl.mjs";
import { Site } from "../../packages/doctor/src/site.mjs";
import { validateExampleNavigation } from "./navigation.mjs";
import { validateExampleAuthors } from "./authors.mjs";

export const checkedModes = ["gem", "template"];

/** Every JSON file under `dir` must parse and declare a `$schema`. Returns the problems. */
export function validateSchemas(dir) {
  const problems = [];
  const walk = (current) => {
    if (!existsSync(current)) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".json")) {
        try {
          const schema = JSON.parse(readFileSync(path, "utf8"));
          if (typeof schema.$schema !== "string") problems.push(`${relative(dir, path)}: missing "$schema"`);
        } catch (error) {
          problems.push(`${relative(dir, path)}: ${error.message}`);
        }
      }
    }
  };
  walk(dir);
  return problems;
}

/** A Seaworthy CLI that is already there, or null. SEAWORTHY_CLI wins, then the pinned checkout, then node_modules. */
export function findSeaworthy(env = process.env, base = root) {
  const candidates = [
    env.SEAWORTHY_CLI,
    join(base, ".seaworthy/seaworthy/packages/verify/dist/src/cli.js"),
    join(base, "node_modules/seaworthy/dist/src/cli.js"),
  ];
  return candidates.find((path) => path && existsSync(path)) ?? null;
}

/** Runs `seaworthy verify` on a built site; warnings fail the check, notes do not. */
export function runSeaworthy(cli, site) {
  const result = spawnSync(process.execPath, [cli, "verify", site, "--fail-on", "warning"], { encoding: "utf8" });
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}` };
}

function skipOrFail(required, message) {
  if (required) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else console.log(`SKIP: ${message}`);
}

export function main(env = process.env) {
  const problems = validateSchemas(join(root, "schema"));
  if (problems.length) {
    console.error(`FAIL: schemas\n${problems.map((p) => `  ${p}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log("OK: schemas");

  const configProblems = validateExampleConfigs();
  if (configProblems.length) {
    console.error(`FAIL: example configs\n${configProblems.map((p) => `  ${p}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log("OK: example configs");

  const navProblems = validateExampleNavigation();
  if (navProblems.length) {
    console.error(`FAIL: example navigation\n${navProblems.map((p) => `  ${p}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log("OK: example navigation");

  const authorProblems = validateExampleAuthors();
  if (authorProblems.length) {
    console.error(`FAIL: example authors\n${authorProblems.map((p) => `  ${p}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log("OK: example authors");

  // Deprecated names warn and never fail (ADR 0012, rule 4); the examples should still use none.
  const deprecated = exampleNames().flatMap((name) => findDeprecations(join(root, "examples", name)).map((d) => `examples/${name}/${d.message}`));
  if (deprecated.length) console.log(`WARN: deprecated keys in the examples\n${deprecated.map((d) => `  ${d}`).join("\n")}`);
  else console.log("OK: no deprecated keys in the examples");

  if (!bundleAvailable()) {
    skipOrFail(env.SLIPWAY_REQUIRE_BUILD === "1", "the example site was not built: install Ruby 3.3 (.ruby-version) and run `bundle install`");
    return;
  }

  let cli = env.SEAWORTHY_CLI && existsSync(env.SEAWORTHY_CLI) ? env.SEAWORTHY_CLI : null;
  if (!cli) {
    try {
      cli = ensureSeaworthy();
    } catch (error) {
      console.error(`Seaworthy setup failed: ${error.message}`);
    }
  }
  const work = mkdtempSync(join(tmpdir(), "slipway-check-"));
  try {
    for (const name of exampleNames()) {
      for (const mode of checkedModes) {
        const label = `${name}, ${mode} mode`;
        const site = buildExample(mode, join(work, name, mode), name);
        console.log(`OK: example site builds (${label})`);
        // Only the minimal site sets theme tokens in its _config.yml.
        if (name === "minimal") {
          const page = readFileSync(join(site, "index.html"), "utf8");
          if (!page.includes("--sl-radius-card: 0.75rem;") || !page.includes('--sl-font-body: "Source Serif 4", Georgia, serif;')) {
            console.error(`FAIL: theme overrides from _config.yml are missing in the built page (${label})`);
            process.exitCode = 1;
          }
        }
        // Every example, the Persian one above all, passes slipway doctor's right-to-left checks.
        const doctorSite = new Site(join(root, "examples", name), { build: site });
        const rtl = Object.values(rtlChecks).flatMap((check) => check(doctorSite).findings);
        if (rtl.length) {
          console.error(`FAIL: right-to-left findings (${label})\n${rtl.map((f) => `  ${f.file}:${f.line} ${f.message}`).join("\n")}`);
          process.exitCode = 1;
        } else console.log(`OK: no right-to-left findings (${label})`);
        if (!cli) continue;
        const { ok, output } = runSeaworthy(cli, site);
        if (ok) console.log(`OK: Seaworthy (${label})`);
        else {
          console.error(`FAIL: Seaworthy (${label})\n${output}`);
          process.exitCode = 1;
        }
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  if (!cli) skipOrFail(env.SLIPWAY_REQUIRE_SEAWORTHY === "1", "Seaworthy did not run: fetching it from git failed (see above); set SEAWORTHY_CLI to a built packages/verify/dist/src/cli.js to use your own");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
