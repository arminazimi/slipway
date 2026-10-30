import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..", "..");
const schemaDir = join(repoRoot, "schema", "front-matter");

const layouts = ["page", "post", "doc"];

export const summary = "Create a page, post, or doc with schema-valid front matter.";

export const usage = `Usage: slipway new <layout> <path> [options]

Creates a Markdown file with front matter for its layout: the schema's
required keys become flags, optional keys stay out, and the site's default
lang goes in. Layouts: page, post, doc. A post path without a date in its
file name gets today's date.

Options:
  --title <title>      the page title (required)
  --lang <tag>         the page language (default: the site's lang)
  --json               output result as JSON
  -h, --help           show this help`;

/** Parses arguments. Returns `{ options }` or `{ error }`. */
export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "new") return { error: command ? `unknown command: ${command}` : "missing command" };

  const options = { layout: null, path: null, title: null, lang: null, format: "text" };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const value = () => {
      const next = rest[++i];
      if (next === undefined || next.startsWith("--")) throw new Error(`${arg} needs a value`);
      return next;
    };
    try {
      if (arg === "-h" || arg === "--help") return { help: true };
      else if (arg === "--json") options.format = "json";
      else if (arg === "--title") options.title = value();
      else if (arg === "--lang") options.lang = value();
      else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
      else if (options.layout === null) options.layout = arg;
      else if (options.path === null) options.path = arg;
      else return { error: `unexpected argument: ${arg}` };
    } catch (error) {
      return { error: error.message };
    }
  }

  if (options.layout === null) return { error: "missing <layout>" };
  if (!layouts.includes(options.layout)) return { error: `unknown layout: ${options.layout}. supported: ${layouts.join(", ")}` };
  if (options.path === null) return { error: "missing <path>" };
  if (!/\.(md|markdown)$/i.test(options.path)) return { error: `path must end in .md: ${options.path}` };
  if (options.title === null) return { error: "missing --title <title>" };
  if (options.title.trim() === "") return { error: "--title must not be empty" };

  return { options };
}

/** Finds the site root above a path, starting at its nearest existing ancestor. */
function findSiteRoot(target) {
  let current = dirname(target);
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  while (current !== dirname(current)) {
    if (existsSync(join(current, "_config.yml"))) return current;
    current = dirname(current);
  }
  return existsSync(join(current, "_config.yml")) ? current : null;
}

/** The required front-matter keys the layout's schema adds, `title` included. */
function requiredKeys(layout) {
  const keys = new Set();
  for (const file of ["base.schema.json", `${layout}.schema.json`]) {
    const path = join(schemaDir, file);
    if (!existsSync(path)) continue;
    const schema = JSON.parse(readFileSync(path, "utf8"));
    for (const key of schema.required ?? []) keys.add(key);
  }
  return keys;
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway new: ${parsed.error}\n\n${usage}`);
    return 2;
  }

  const { layout, format } = parsed.options;
  let target = resolve(parsed.options.path);
  let title = parsed.options.title;
  let lang = parsed.options.lang;

  for (const key of requiredKeys(layout)) {
    if (key === "title") continue;
    error(`slipway new: the ${layout} schema requires ${key}, which this command cannot fill yet`);
    return 2;
  }

  if (layout === "post" && !/^\d{4}-\d{2}-\d{2}-/.test(basename(target))) {
    target = join(dirname(target), `${new Date().toISOString().slice(0, 10)}-${basename(target)}`);
  }

  const siteRoot = findSiteRoot(target);
  if (siteRoot === null) {
    if (format === "json") log(JSON.stringify({ error: `no site root (no _config.yml) above ${target}` }));
    else error(`slipway new: no site root (no _config.yml) above ${target}`);
    return 1;
  }

  const relativePath = relative(siteRoot, target).split("\\").join("/");

  if (existsSync(target)) {
    if (format === "json") log(JSON.stringify({ error: `file already exists: ${relativePath}` }));
    else error(`slipway new: file already exists: ${relativePath}`);
    return 1;
  }

  if (lang === null) {
    const configPath = join(siteRoot, "_config.yml");
    const config = yaml.parse(readFileSync(configPath, "utf8")) ?? {};
    lang = config.lang ?? "en";
  }

  const data = { title, layout };
  if (lang) data.lang = lang;
  const content = `---\n${yaml.stringify(data)}---\n`;

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");

  if (format === "json") {
    log(JSON.stringify({ path: relativePath, layout, title, lang }, null, 2));
  } else {
    log(`created ${relativePath}`);
  }
  return 0;
}
