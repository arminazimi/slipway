// Validates a site's _config.yml and the front matter of every Markdown page against the schemas in schema/.
// Each problem names the file, the line, the key, and the allowed values. `slipway doctor` will call validateSite.
//   node tools/theme/validate.mjs [site folder ...]   (every example site by default)
import Ajv2020 from "ajv/dist/2020.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { LineCounter, isMap, isSeq, parseDocument } from "yaml";
import { allowedFor, frontMatter, markdownFiles, validateFrontMatter } from "./front-matter.mjs";
import { root } from "./tokens.mjs";

const configSchema = JSON.parse(readFileSync(join(root, "schema/slipway-config.schema.json"), "utf8"));
const validateConfigSchema = new Ajv2020({ allErrors: true, verbose: true }).compile(configSchema);

/** Parses YAML and returns its data with a function that finds the 1-based line of a key path. */
function parseWithLines(source) {
  const lineCounter = new LineCounter();
  const doc = parseDocument(source, { lineCounter });
  if (doc.errors.length) {
    const [error] = doc.errors;
    const message = error.message.split("\n")[0].replace(/ at line \d+, column \d+:?$/, "");
    return { error: message, errorLine: error.linePos?.[0]?.line ?? 1 };
  }
  const lineAt = (offset) => lineCounter.linePos(offset).line;
  /** The line of the deepest node on `path` that exists: the key itself when present, else its parent. */
  const lineOf = (path) => {
    let node = doc.contents;
    let line = node?.range ? lineAt(node.range[0]) : 1;
    for (const segment of path) {
      if (isMap(node)) {
        const pair = node.items.find((item) => String(item.key?.value ?? item.key) === segment);
        if (!pair) break;
        if (pair.key?.range) line = lineAt(pair.key.range[0]);
        node = pair.value;
      } else if (isSeq(node) && node.items[Number(segment)]) {
        node = node.items[Number(segment)];
        if (node.range) line = lineAt(node.range[0]);
      } else break;
    }
    return line;
  };
  return { data: doc.toJS() ?? {}, lineOf };
}

/** Problems in a parsed _config.yml: one per key, the most specific error wins, like front matter. */
export function configProblems(data) {
  if (validateConfigSchema(data)) return [];
  const byKey = new Map();
  for (const error of validateConfigSchema.errors) {
    const path = error.instancePath.split("/").slice(1);
    let allowed = allowedFor(error);
    let message = error.message;
    if (error.keyword === "additionalProperties") {
      path.push(error.params.additionalProperty);
      message = "is not a known key";
      allowed = Object.keys(error.parentSchema.properties ?? {});
    } else if (error.keyword === "required") {
      path.push(error.params.missingProperty);
      message = "is required";
      allowed = [];
    } else if (error.keyword === "pattern" && error.parentSchema.description) {
      // Config descriptions are long; their first sentence names the expected form.
      allowed = [error.parentSchema.description.split(/(?<=\.)\s/)[0]];
    } else if (error.keyword === "anyOf") {
      message = "does not match any allowed form";
    }
    const key = path.join(".") || "/";
    if (byKey.has(key) && error.keyword !== "anyOf") continue;
    byKey.set(key, { path, key, message, allowed });
  }
  return [...byKey.values()];
}

function relativeFile(path, base) {
  return relative(base, path).split(sep).join("/");
}

/** Problems in a site's _config.yml. A site without one has none. */
export function validateConfigFile(path, base = root) {
  if (!existsSync(path)) return [];
  const file = relativeFile(path, base);
  const parsed = parseWithLines(readFileSync(path, "utf8"));
  if (parsed.error) return [{ file, line: parsed.errorLine, key: "/", message: `YAML does not parse: ${parsed.error}`, allowed: [] }];
  return configProblems(parsed.data).map(({ path: keyPath, key, message, allowed }) => ({
    file,
    line: parsed.lineOf(keyPath),
    key,
    message,
    allowed,
  }));
}

/** Problems in one Markdown page's front matter. Pages without front matter are skipped. */
export function validatePage(path, base = root) {
  const file = relativeFile(path, base);
  const source = frontMatter(readFileSync(path, "utf8"));
  if (source === null) return [];
  // The front matter starts on line 2, after the opening `---`.
  const parsed = parseWithLines(source);
  if (parsed.error) return [{ file, line: parsed.errorLine + 1, key: "/", message: `YAML does not parse: ${parsed.error}`, allowed: [] }];
  return validateFrontMatter(parsed.data, file).map(({ key, message, allowed }) => ({
    file,
    line: (key === "/" ? 1 : parsed.lineOf([key])) + 1,
    key,
    message,
    allowed,
  }));
}

/** Problems in a site folder: its _config.yml, then every Markdown page under it. Paths are relative to `base`. */
export function validateSite(dir, base = process.cwd()) {
  return [
    ...validateConfigFile(join(dir, "_config.yml"), base),
    ...markdownFiles(dir).sort().flatMap((path) => validatePage(path, base)),
  ];
}

/** `path:line key: message (allowed: ...)` */
export function formatProblem({ file, line, key, message, allowed }) {
  return `${file}:${line} ${key}: ${message}${allowed.length ? ` (allowed: ${allowed.join(", ")})` : ""}`;
}

/** Every examples/<name> folder. */
export function exampleSites(dir = join(root, "examples")) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(dir, entry.name))
    .sort();
}

/** Validates the given site folders (every example by default), prints the problems, and returns an exit code. */
export function main(args = process.argv.slice(2), { log = console.log, error = console.error } = {}) {
  const sites = args.length ? args.map((arg) => resolve(arg)) : exampleSites();
  const missing = sites.filter((site) => !existsSync(site));
  for (const site of missing) error(`${relativeFile(site, process.cwd())}: no such folder`);
  const problems = sites.filter((site) => existsSync(site)).flatMap((site) => validateSite(site));
  for (const problem of problems) error(formatProblem(problem));
  if (problems.length || missing.length) return 1;
  log(`schemas: ${sites.length} site${sites.length === 1 ? "" : "s"}, config and front matter valid`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main();
