// Warns about deprecated config keys and front-matter fields in a site (ADR 0012, rule 4), naming the
// replacement. It never fails: a deprecated name keeps working until the release in `removed_in`.
// The list is schema/deprecations.json; _includes/compat.html makes the layouts read the old names.
// Usage: node tools/theme/deprecations.mjs <site dir> [--list <deprecations.json>]
import Ajv2020 from "ajv/dist/2020.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LineCounter, isMap, parseDocument } from "yaml";
import { root } from "./tokens.mjs";

export const defaultList = join(root, "schema/deprecations.json");
const schema = JSON.parse(readFileSync(join(root, "schema/deprecations.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

/** The entries of a deprecations file; throws when it does not match schema/deprecations.schema.json. */
export function loadDeprecations(path = defaultList) {
  const list = JSON.parse(readFileSync(path, "utf8"));
  if (!validate(list)) throw new Error(`${path}: ${validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ")}`);
  return list.deprecations;
}

// Files Jekyll reads front matter from; folders it never builds.
const pageFile = /\.(md|markdown|html|htm|xml|json|txt|css|scss|js)$/;
const skipDir = (name) => name.startsWith(".") || ["_site", "node_modules", "vendor"].includes(name);

function siteFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return skipDir(entry.name) ? [] : siteFiles(path, base);
    return pageFile.test(entry.name) ? [relative(base, path)] : [];
  });
}

/** The 1-based line of the key at `path` (an array) under `node`, or null when it is not set. */
function keyLine(node, path, lines) {
  for (const [i, name] of path.entries()) {
    if (!isMap(node)) return null;
    const pair = node.items.find((item) => item.key?.value === name);
    if (!pair) return null;
    if (i === path.length - 1) return lines.linePos(pair.key.range[0]).line;
    node = pair.value;
  }
  return null;
}

function parseYaml(text) {
  const lines = new LineCounter();
  const doc = parseDocument(text, { lineCounter: lines });
  return { doc, lines };
}

/** The front matter of a page as text, or null when the file has none. */
function frontMatter(text) {
  const match = /^---[ \t]*\r?\n([\s\S]*?\r?\n)?---[ \t]*(\r?\n|$)/.exec(text);
  return match ? (match[1] ?? "") : null;
}

/**
 * Deprecated names a site uses: `{ file, line, kind, old, new, since, removed_in, message }`, sorted by
 * file and line. `file` is relative to `dir`.
 */
export function findDeprecations(dir, deprecations = loadDeprecations()) {
  const found = [];
  const add = (file, line, entry) =>
    found.push({ file, line, ...entry, message: `${file}:${line} ${entry.old} is deprecated since ${entry.since}, use ${entry.new}` });
  const config = deprecations.filter((entry) => entry.kind === "config");
  const fields = deprecations.filter((entry) => entry.kind === "front-matter");

  const configPath = join(dir, "_config.yml");
  if (existsSync(configPath)) {
    const { doc, lines } = parseYaml(readFileSync(configPath, "utf8"));
    for (const entry of config) {
      const line = keyLine(doc.contents, entry.old.split("."), lines);
      if (line) add("_config.yml", line, entry);
    }
    // Front-matter defaults: `defaults: [{ scope, values }]`.
    const defaults = doc.get("defaults");
    for (const item of defaults?.items ?? []) {
      for (const entry of fields) {
        const line = keyLine(item, ["values", ...entry.old.split(".")], lines);
        if (line) add("_config.yml", line, entry);
      }
    }
  }

  if (fields.length) {
    for (const file of siteFiles(dir)) {
      const yaml = frontMatter(readFileSync(join(dir, file), "utf8"));
      if (yaml === null) continue;
      const { doc, lines } = parseYaml(yaml);
      for (const entry of fields) {
        const line = keyLine(doc.contents, entry.old.split("."), lines);
        if (line) add(file, line + 1, entry); // + 1 for the opening ---
      }
    }
  }
  return found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const at = args.indexOf("--list");
  const list = at >= 0 ? resolve(args.splice(at, 2)[1]) : defaultList;
  const dir = resolve(args[0] ?? ".");
  const found = findDeprecations(dir, loadDeprecations(list));
  for (const { message } of found) console.log(message);
  if (!found.length) console.log(`no deprecated keys in ${dir}`);
}
