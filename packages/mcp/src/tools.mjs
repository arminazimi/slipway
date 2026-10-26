// The read-only tools of the Slipway MCP server. Each takes the site directory and returns plain data (or a promise of it) or throws.
import { existsSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { validateConfig } from "../../../tools/theme/config.mjs";
import { exitCode } from "../../doctor/src/cli.mjs";
import { doctor, levels } from "../../doctor/src/doctor.mjs";

export const themeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const frontMatterDir = join(themeRoot, "schema/front-matter");
// Layouts without a schema of their own use these (schema/front-matter/README.md); any other layout uses `base`.
const schemaFallback = { default: "page", tags: "page", "not-found": "page" };

function outside(base, target) {
  const rel = relative(base, target);
  return rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel);
}

/** The real path of `path` inside `site`; throws when it resolves (symlinks included) outside the site. */
export function insideSite(site, path) {
  const base = realpathSync(site);
  const target = resolve(base, path);
  if (outside(base, target)) throw new Error(`${path} is outside the site directory`);
  if (!existsSync(target)) throw new Error(`${path} does not exist in the site`);
  if (outside(base, realpathSync(target))) throw new Error(`${path} is outside the site directory`);
  return realpathSync(target);
}

function frontMatter(file) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(file, "utf8"));
  return match ? (parse(match[1]) ?? {}) : {};
}

function layoutSchema(name) {
  for (const candidate of [name, schemaFallback[name], "base"]) {
    const file = candidate && join(frontMatterDir, `${candidate}.schema.json`);
    if (file && existsSync(file)) return { schemaFile: relative(themeRoot, file), schema: JSON.parse(readFileSync(file, "utf8")) };
  }
  return { schemaFile: null, schema: null };
}

function layoutsIn(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((file) => file.endsWith(".html")).map((file) => ({ name: file.slice(0, -5), file: join(dir, file) }));
}

/** Every layout the site can use: the theme's, with the site's own `_layouts` overriding them by name. */
export function listLayouts(site) {
  const layouts = new Map();
  for (const { name, file } of layoutsIn(join(themeRoot, "_layouts"))) layouts.set(name, { name, source: "theme", file });
  const own = join(site, "_layouts");
  if (existsSync(own)) {
    for (const { name, file } of layoutsIn(insideSite(site, "_layouts"))) layouts.set(name, { name, source: "site", file });
  }
  return [...layouts.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, source, file }) => ({ name, source, extends: frontMatter(file).layout ?? null, ...layoutSchema(name) }));
}

/** The site's config file parsed and checked against schema/slipway-config.schema.json. */
export function readConfig(site, file = "_config.yml") {
  if (!/\.ya?ml$/.test(file)) throw new Error(`${file} is not a YAML config file`);
  const path = insideSite(site, file);
  let config;
  try {
    config = parse(readFileSync(path, "utf8")) ?? {};
  } catch (error) {
    throw new Error(`${file} is not valid YAML: ${error.message}`);
  }
  const { ok, errors } = validateConfig(config);
  return { file, valid: ok, errors, config };
}

/**
 * `slipway doctor` on the site, with `build` as the output folder inside it. Returns the doctor's JSON report with
 * `ok` and `target` first: `ok` follows the CLI's exit code, true when the site reaches `level`, or with no level
 * when every MUST test passes. Never uses the network.
 */
export async function runDoctor(site, { build, level } = {}) {
  if (level !== undefined && !levels.includes(level)) throw new Error(`level must be one of ${levels.join(", ")}`);
  const report = await doctor(realpathSync(site), { build: build === undefined ? null : insideSite(site, build) });
  return { ok: exitCode(report, level) === 0, target: level ?? null, ...report };
}
