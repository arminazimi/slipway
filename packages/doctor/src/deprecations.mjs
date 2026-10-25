// Deprecated config keys and front-matter fields a Jekyll site uses (ADR 0012, rule 4), with file and line.
// Shared with tools/theme/deprecations.mjs, which validates the list and prints the warnings for the examples.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { LineCounter, isMap, parseDocument } from "yaml";

/** The packaged copy of schema/deprecations.json: its entries. */
export function packagedDeprecations() {
  return JSON.parse(readFileSync(fileURLToPath(new URL("../schema/deprecations.json", import.meta.url)), "utf8")).deprecations;
}

// Files Jekyll reads front matter from; folders it never builds.
const pageFile = /\.(md|markdown|html|htm|xml|json|txt|css|scss|js)$/;
const skipDir = (name) => name.startsWith(".") || ["_site", "node_modules", "vendor"].includes(name);

function siteFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return skipDir(entry.name) ? [] : siteFiles(path, base);
    return pageFile.test(entry.name) ? [relative(base, path).split(sep).join("/")] : [];
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
export function findDeprecations(dir, deprecations = packagedDeprecations()) {
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
