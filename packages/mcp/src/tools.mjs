// The read-only tools of the Slipway MCP server. Each takes the site directory and returns plain data (or a promise of it) or throws.
import { existsSync, readFileSync, readdirSync, realpathSync, writeFileSync, mkdirSync } from "node:fs";
import { parseDocument, Document } from "yaml";
import * as yaml from "yaml";
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

/** Writes a new page with front matter and content. */
export function createPage(site, { path, frontMatter, content }) {
  const base = realpathSync(site);
  const file = resolve(base, path);
  if (outside(base, file)) throw new Error(`${path} is outside the site directory`);
  mkdirSync(dirname(file), { recursive: true });

  let fm = {};
  try {
    fm = JSON.parse(frontMatter);
  } catch (e) {
    throw new Error("frontMatter must be valid JSON");
  }

  const yamlString = Object.keys(fm).length > 0 ? `---\n${yaml.stringify(fm)}---\n` : "";
  writeFileSync(file, `${yamlString}${content}`);
  return { status: "created", file: path };
}

/** Sets a token in _config.yml. */
export function setToken(site, { token, value }) {
  const base = realpathSync(site);
  const file = resolve(base, "_config.yml");
  let doc;
  if (existsSync(file)) {
    doc = parseDocument(readFileSync(file, "utf8"));
  } else {
    doc = new Document({});
  }

  if (!doc.has("slipway")) doc.set("slipway", doc.createNode({}));
  let slipway = doc.get("slipway");
  if (!slipway) { doc.set("slipway", doc.createNode({})); slipway = doc.get("slipway"); }
  if (typeof slipway.has === "function" && !slipway.has("tokens")) slipway.set("tokens", doc.createNode({}));
  const tokens = slipway.get ? slipway.get("tokens") : null;
  if (tokens && typeof tokens.set === "function") {
    tokens.set(token, value);
  }

  writeFileSync(file, doc.toString());
  return { status: "set", token, value };
}

/** Adds an item to the main navigation in _data/navigation.yml. */
export function addNavigationItem(site, { title, url }) {
  const base = realpathSync(site);
  const dir = resolve(base, "_data");
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, "navigation.yml");

  let doc;
  if (existsSync(file)) {
    doc = parseDocument(readFileSync(file, "utf8"));
  } else {
    doc = new Document({});
  }

  if (!doc.has("main")) doc.set("main", doc.createNode([]));
  const main = doc.get("main");
  if (main && typeof main.add === "function") {
    main.add(doc.createNode({ title, url }));
  } else if (main && Array.isArray(main.items)) {
    main.items.push(doc.createNode({ title, url }));
  }

  writeFileSync(file, doc.toString());
  return { status: "added", title, url };
}

/** Returns preview instructions. */
export function preview(site) {
  return {
    instructions: "To build the site locally, give it a Gemfile with gem \"github-pages\", group: :jekyll_plugins, then run:\n\nbundle exec jekyll build\n\nRead every error and warning and fix them the same way. To look at the result, run bundle exec jekyll serve and open the address it prints. Without a Gemfile, push and read the log of the Pages build."
  };
}
