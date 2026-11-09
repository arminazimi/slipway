// `node tools/sourcemap/run.ts [site] [--check]`: builds a site's model with the engine, runs the engine's
// `sourcemap` output, and validates the result (spec/sourcemap/v0.md, ADR 0007). The Ruby generator is gone:
// the engine computes the map, and this tool writes or checks the committed copy.
//
//   node tools/sourcemap/run.ts [site]            write <site>/sourcemap.json
//   node tools/sourcemap/run.ts [site] --check    fail when the committed map is missing or stale
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { OutputContext } from "../../packages/engine/src/contracts/output.ts";
import { buildModel } from "../../packages/engine/src/model/build.ts";
import { sourcemap } from "../../packages/engine/src/outputs/sourcemap.ts";
import { validateSourcemap } from "../theme/sourcemap.ts";

/** The file the map lands in, in the built site and beside the site's source. */
const FILE = "sourcemap.json";

/** The engine's source map reads only the model, so rendering a page here would be a bug. */
const ctx: OutputContext = {
  renderPage: () => Promise.reject(new Error("the source map never renders a page")),
  report: () => {},
};

/** Builds `site`'s model and returns the `sourcemap.json` text the engine's `sourcemap` output writes. */
export async function generateSourcemap(site: string): Promise<string> {
  const root = resolve(site);
  const { site: model, diagnostics } = await buildModel(root);
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  if (errors.length > 0) {
    const lines = errors.map((diagnostic) => `  ${diagnostic.id}: ${diagnostic.message}`);
    throw new Error(`sourcemap: ${root} has ${errors.length} build error(s):\n${lines.join("\n")}`);
  }
  const files = await sourcemap.run(model, ctx);
  const map = files.find((file) => file.path === FILE);
  if (map === undefined) throw new Error(`sourcemap: the engine wrote no ${FILE}`);
  return typeof map.contents === "string" ? map.contents : new TextDecoder().decode(map.contents);
}

/** Writes or checks the map of `site`; returns the process exit code. */
export async function main(args: readonly string[] = process.argv.slice(2)): Promise<number> {
  const check = args.includes("--check");
  const site = args.find((arg) => !arg.startsWith("--")) ?? ".";
  const text = await generateSourcemap(site);
  const { ok, errors } = validateSourcemap(JSON.parse(text));
  if (!ok) {
    console.error(`the generated map does not validate:\n${errors.join("\n")}`);
    return 1;
  }
  const file = join(resolve(site), FILE);
  if (check) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== text) {
      console.error(`FAIL: ${file} is missing or stale; run \`node tools/sourcemap/run.ts ${site}\` and commit it`);
      return 1;
    }
    console.log(`OK: ${file} is up to date`);
    return 0;
  }
  writeFileSync(file, text);
  console.log(`wrote ${file}`);
  return 0;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main();
}
