// Validates the front matter of Markdown files against schema/front-matter/<layout>.schema.json.
//   node tools/theme/front-matter.mjs [file or folder ...]   (every example site by default)
import Ajv2020 from "ajv/dist/2020.js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { parse } from "yaml";
import { allowedFor, frontMatter } from "slipway/yaml";
import { root } from "./tokens.mjs";

export { allowedFor, frontMatter };

export const schemaDir = join(root, "schema/front-matter");

/** Layout name to schema name. A layout not listed here gets `base`. */
export const layoutSchemas = {
  page: "page",
  default: "page",
  tags: "page",
  "not-found": "page",
  doc: "doc",
  post: "post",
  home: "home",
  archive: "archive",
  author: "author",
  adr: "adr",
  "adr-index": "page",
};

/** Collection folder to schema name, for pages without `layout`. */
export const collectionSchemas = { _posts: "post", _docs: "doc" };

const ajv = new Ajv2020({ allErrors: true, verbose: true });
const schemaNames = [...new Set(["base", ...Object.values(layoutSchemas)])];
for (const name of schemaNames) {
  ajv.addSchema(JSON.parse(readFileSync(join(schemaDir, `${name}.schema.json`), "utf8")), name);
}

/** The schema name for a page, from its `layout` or else its collection folder. */
export function schemaFor(data, file = "") {
  if (typeof data?.layout === "string") return layoutSchemas[data.layout] ?? "base";
  const folder = file.split(/[\\/]/).find((part) => part in collectionSchemas);
  return folder ? collectionSchemas[folder] : "page";
}

/**
 * Validates front matter data. Each problem has the key, a message, and the allowed values.
 * One problem per key: the most specific error wins.
 */
export function validateFrontMatter(data, file = "") {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return [{ file, key: "/", message: "front matter must be a YAML mapping", allowed: ["key: value pairs"] }];
  }
  const schema = schemaFor(data, file);
  const validate = ajv.getSchema(schema);
  if (validate(data)) return [];
  const byKey = new Map();
  for (const error of validate.errors) {
    if (error.keyword === "allOf") continue;
    const missing = error.params?.missingProperty;
    const key = missing ?? (error.instancePath.split("/")[1] || "/");
    if (byKey.has(key) && error.keyword !== "oneOf") continue;
    const message =
      error.keyword === "required" ? "is required"
      : error.keyword === "dependentRequired" ? `is required with ${error.params.property}`
      : error.keyword === "oneOf" ? "must be a list or a string"
      : error.message;
    byKey.set(key, { file, key, schema, message, allowed: missing ? [] : allowedFor(error) });
  }
  return [...byKey.values()];
}

/** Reads one Markdown file and validates its front matter. Files without front matter are skipped. */
export function validateFile(path, base = root) {
  const file = relative(base, path).split(sep).join("/");
  const source = frontMatter(readFileSync(path, "utf8"));
  if (source === null) return [];
  let data;
  try {
    data = parse(source) ?? {};
  } catch (error) {
    return [{ file, key: "/", message: `YAML does not parse: ${error.message.split("\n")[0]}`, allowed: [] }];
  }
  return validateFrontMatter(data, file);
}

/** Every Markdown page under `dir`, skipping READMEs, `_site`, and dependency folders. */
export function markdownFiles(dir) {
  if (statSync(dir).isFile()) return [dir];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return ["_site", "node_modules", "vendor", ".git"].includes(entry.name) ? [] : markdownFiles(path);
    return entry.name.endsWith(".md") && basename(entry.name) !== "README.md" ? [path] : [];
  });
}

export function formatProblem({ file, key, message, allowed }) {
  return `${file}: ${key} ${message}${allowed.length ? ` (allowed: ${allowed.join(", ")})` : ""}`;
}

/** Problems in every Markdown file under the given paths (the example sites by default). */
export function validatePaths(paths = [join(root, "examples")], base = root) {
  return paths.filter((path) => existsSync(path)).flatMap(markdownFiles).flatMap((path) => validateFile(path, base));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const args = process.argv.slice(2);
  const problems = validatePaths(args.length ? args.map((arg) => join(process.cwd(), arg)) : undefined, process.cwd());
  for (const problem of problems) console.error(formatProblem(problem));
  if (problems.length) process.exit(1);
  console.log("front matter: every page matches its schema");
}
