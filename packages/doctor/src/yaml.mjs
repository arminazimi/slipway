// YAML and front matter with line numbers, and Ajv errors turned into allowed values.
// Generator-neutral: tools/theme/validate.mjs re-exports these for Slipway's own schemas.
import { LineCounter, isMap, isSeq, parseDocument } from "yaml";

/** Parses YAML and returns its data with a function that finds the 1-based line of a key path. */
export function parseWithLines(source) {
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

/**
 * Splits front matter off a content file. Returns null when there is none, else
 * `{ format, text, offset }`: `yaml` (`---`), `toml` (`+++`), or `json` (a leading `{`),
 * and the number of lines before the block's first line.
 */
export function splitFrontMatter(source) {
  const yaml = /^---\r?\n([\s\S]*?)\r?\n?---\r?\n?/.exec(source);
  if (yaml) return { format: "yaml", text: yaml[1], offset: 1 };
  const toml = /^\+\+\+\r?\n([\s\S]*?)\r?\n?\+\+\+\r?\n?/.exec(source);
  if (toml) return { format: "toml", text: toml[1], offset: 1 };
  if (source.startsWith("{")) {
    const end = jsonObjectEnd(source);
    if (end > 0) return { format: "json", text: source.slice(0, end), offset: 0 };
  }
  return null;
}

/** The index after the `}` that closes the JSON object at the start of `source`, or -1. */
function jsonObjectEnd(source) {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inString) {
      if (char === "\\") i++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return i + 1;
  }
  return -1;
}

/** The YAML text between `---` lines at the top of a Markdown source, or null. */
export function frontMatter(source) {
  const block = splitFrontMatter(source);
  return block?.format === "yaml" ? block.text : null;
}

/** Allowed values for an Ajv error, for messages. Needs an Ajv instance with `verbose: true`. */
export function allowedFor(error) {
  const schema = error.parentSchema ?? {};
  if (error.keyword === "enum") return error.params.allowedValues.map(String);
  if (error.keyword === "const") return [String(error.params.allowedValue)];
  if (error.keyword === "type") return [`a ${[error.params.type].flat().join(" or ")}`];
  if (error.keyword === "oneOf") return ["a list", "a space-separated string"];
  if (error.keyword === "minLength") return ["a non-empty string"];
  if (schema.description) return [schema.description];
  if (error.keyword === "pattern") return [`text matching ${error.params.pattern}`];
  return [];
}

/** `path:line key: message (allowed: ...)` */
export function formatProblem({ file, line, key, message, allowed = [] }) {
  return `${file}${line ? `:${line}` : ""} ${key}: ${message}${allowed.length ? ` (allowed: ${allowed.join(", ")})` : ""}`;
}
