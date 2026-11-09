// Converts the Markdown pages of a Slipway 0.2 site to the 0.3 names: the layouts that were renamed,
// the front-matter keys that changed (ADR 0024, rules 3 and 4), and the Liquid callout includes that
// have a directive equivalent. Everything else is reported with its file and line and left in place.
// `redirect_from`, `redirect_to`, `image`, `translation_key`, and `search` keep their meaning (ADR 0024
// rule 3), so they are not rewritten. The navigation check reads `_data/navigation.yml` against
// schema/navigation.schema.json and changes nothing.
//
//   migrateContent(source, file)    -> { text, changes, reports }  (text is the converted file)
//   migrateContentFile(file)        -> the same, for a file on disk; nothing is written
//   checkNavigation(source, file)   -> reports for a navigation file the engine would reject
//
// The CLI that walks a site and writes files lives in tools/migrate/run.ts (#1184); this module is the
// rewrite it calls. The issue's Files list named `.mjs` files; AGENTS.md ("TypeScript only") says `.ts`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parseDocument } from "yaml";

/** A change made, or a place a person must look at, with the file and line it is on. */
export type ContentNote = { file: string; line: number; note: string };

export type ContentResult = {
  /** The converted file. Equal to the source when nothing changed. */
  text: string;
  /** Every change made, with its line. */
  changes: ContentNote[];
  /** Liquid left in place and layouts with no engine name: the places a person must check. */
  reports: ContentNote[];
};

/**
 * 0.2 layout names and the engine layout each one becomes. `page` and `default` were the plain pages
 * with a title and a body; `doc` is their engine layout, and it reads its sidebar from navigation.
 * A layout not in this map is reported and left as it is: the engine fails the build on an unknown name.
 */
export const LAYOUTS: ReadonlyMap<string, string> = new Map([
  ["base", "base"],
  ["default", "doc"],
  ["doc", "doc"],
  ["home", "home"],
  ["not-found", "not-found"],
  ["page", "doc"],
]);

/** The engine's name for a 0.2 layout, or `undefined` when it has none yet. */
export function mapLayout(name: string): string | undefined {
  return LAYOUTS.get(name);
}

/** 0.2 callout kinds that are not the engine's: `danger` is now `caution`, as the callout component aliases it. */
const CALLOUT_KIND_ALIASES: ReadonlyMap<string, string> = new Map([["danger", "caution"]]);

/** The attributes a 0.2 callout include takes that have a directive attribute. */
const CALLOUT_ARGS = new Set(["type", "title", "body"]);

const CALLOUT_INCLUDE = /^include\s+blocks\/callout\.html(?=\s|$)/;
const CALLOUT_INCLUDE_NAME = "include blocks/callout.html";

/** Replaces `s` with spaces, keeping its newlines, so offsets and line numbers do not move. */
const blank = (text: string) => text.replace(/[^\n]/g, " ");

/**
 * The body with everything that is not content blanked out: `{% raw %}` blocks, fenced code, and inline
 * code spans. Liquid inside those is an example, not a tag, so it is neither converted nor reported.
 */
function visibleText(body: string): string {
  const text = body.replace(/\{%-?\s*raw\s*-?%\}[\s\S]*?\{%-?\s*endraw\s*-?%\}/g, blank);
  const lines = text.split("\n");
  let fence: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (fence === null) {
      const open = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (open) {
        fence = open[1]!;
        lines[i] = blank(line);
      } else {
        lines[i] = line.replace(/(`+)(.*?)\1/g, blank);
      }
    } else {
      lines[i] = blank(line);
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (close && close[1]![0] === fence[0] && close[1]!.length >= fence.length) fence = null;
    }
  }
  return lines.join("\n");
}

/** The directive a callout include becomes, one line per row, indented as the include was. */
function calloutLines(args: Record<string, string>, indent: string): string[] {
  const attrs: string[] = [];
  if (args.type !== undefined) {
    const kind = args.type.trim();
    attrs.push(`type="${CALLOUT_KIND_ALIASES.get(kind) ?? kind}"`);
  }
  if (args.title !== undefined) attrs.push(`title="${args.title.trim()}"`);
  const open = `:::callout${attrs.length > 0 ? `{${attrs.join(" ")}}` : ""}`;
  const body = args.body?.trim() ?? "";
  const rows = body === "" ? [open, ":::"] : [open, body, ":::"];
  return rows.map((row) => indent + row);
}

/** Reads the `key="value"` arguments of a callout include; any other argument is a problem to report. */
function parseCalloutArgs(rest: string): { args: Record<string, string> } | { problem: string } {
  const args: Record<string, string> = {};
  const arg = /\s*([A-Za-z_][\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/y;
  let pos = 0;
  while (pos < rest.length) {
    arg.lastIndex = pos;
    const match = arg.exec(rest);
    if (!match) {
      const left = rest.slice(pos).trim();
      if (left === "") break;
      return { problem: `the argument ${left} is not a literal string, so the callout cannot be written statically` };
    }
    const key = match[1]!;
    const value = match[2] ?? match[3] ?? "";
    if (!CALLOUT_ARGS.has(key)) return { problem: `the argument ${key} has no callout attribute` };
    if (args[key] !== undefined) return { problem: `the argument ${key} is given twice` };
    if (value.includes('"') || value.includes("\n")) return { problem: `the value of ${key} has a double quote or a line break` };
    args[key] = value;
    pos = arg.lastIndex;
  }
  return { args };
}

type Edit = { start: number; end: number; text: string; note: string };

/**
 * A standalone callout include on its own line becomes a callout directive. Anything else on that line
 * (text before or after the tag), or an argument that is not a literal string, is a reason to leave it.
 */
function calloutEdit(body: string, start: number, end: number, inner: string): Edit | { problem: string } {
  const lineStart = body.lastIndexOf("\n", start - 1) + 1;
  let lineEnd = body.indexOf("\n", end);
  if (lineEnd === -1) lineEnd = body.length;
  const before = body.slice(lineStart, start);
  const after = body.slice(end, lineEnd);
  if (before.trim() !== "" || after.trim() !== "") {
    return { problem: "it shares its line with other text, and a callout is a block" };
  }
  const parsed = parseCalloutArgs(inner.slice(CALLOUT_INCLUDE_NAME.length));
  if ("problem" in parsed) return parsed;
  return {
    start: lineStart,
    end: lineEnd,
    text: calloutLines(parsed.args, before).join("\n"),
    note: "callout include -> :::callout directive",
  };
}

/** Converts the body and collects its changes and reports. `bodyLine0` is how many lines come before the body. */
function convertBody(body: string, bodyLine0: number, file: string): { text: string; changes: ContentNote[]; reports: ContentNote[] } {
  const visible = visibleText(body);
  const lineOf = (index: number) => bodyLine0 + body.slice(0, index).split("\n").length;
  const edits: Edit[] = [];
  const changes: ContentNote[] = [];
  const reports: ContentNote[] = [];

  for (const match of visible.matchAll(/\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g)) {
    const start = match.index!;
    const raw = match[0];
    const isTag = raw.startsWith("{%");
    const inner = raw.slice(2, -2).replace(/^-/, "").replace(/-$/, "").trim();
    const line = lineOf(start);

    if (isTag && CALLOUT_INCLUDE.test(inner)) {
      const result = calloutEdit(body, start, start + raw.length, inner);
      if ("problem" in result) {
        reports.push({ file, line, note: `${raw.trim()} left in place: ${result.problem}` });
      } else {
        edits.push(result);
        changes.push({ file, line, note: result.note });
      }
    } else {
      reports.push({ file, line, note: `Liquid ${isTag ? "tag" : "output"} ${raw.trim()} left in place; write it as Markdown or a directive` });
    }
  }

  let text = body;
  for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
    text = text.slice(0, edit.start) + edit.text + text.slice(edit.end);
  }
  return { text, changes, reports };
}

/** Front-matter keys that changed meaning: the old key, the new key, and the layout rename when it is one. */
const RENAMED_KEYS = new Map([
  ["nav_order", "order"],
  ["direction", "dir"],
]);

/** Converts the front-matter lines; `firstLine` is the file line of the first one. */
function convertFront(lines: string[], firstLine: number, file: string): { lines: string[]; changes: ContentNote[]; reports: ContentNote[] } {
  const out = [...lines];
  const changes: ContentNote[] = [];
  const reports: ContentNote[] = [];
  const keys = new Set(lines.map((line) => /^([A-Za-z_][\w-]*)\s*:/.exec(line)?.[1]).filter((k) => k !== undefined));

  lines.forEach((line, i) => {
    const match = /^(layout|nav_order|direction)(\s*):(.*)$/.exec(line);
    if (!match) return;
    const [, key, , rest] = match;
    const lineNo = firstLine + i;
    const cr = line.endsWith("\r") ? "\r" : "";

    if (key === "layout") {
      const value = rest!.replace(/\r$/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
      const engine = mapLayout(value);
      if (engine === undefined) {
        reports.push({ file, line: lineNo, note: `layout ${value} has no engine layout yet; the build fails on an unknown layout until it is renamed or removed` });
      } else if (engine !== value) {
        out[i] = `layout: ${engine}${cr}`;
        changes.push({ file, line: lineNo, note: `layout ${value} -> ${engine}` });
      }
      return;
    }

    const to = RENAMED_KEYS.get(key!)!;
    if (keys.has(to)) {
      reports.push({ file, line: lineNo, note: `${key} and ${to} are both set; ${key} is left in place` });
      return;
    }
    out[i] = `${to}:${rest}`;
    changes.push({ file, line: lineNo, note: `${key} -> ${to}` });
  });

  return { lines: out, changes, reports };
}

/**
 * Converts one Markdown page. Front matter is converted line by line so the rest of the file keeps its
 * text exactly; the body keeps everything that is not a callout include.
 */
export function migrateContent(source: string, file = "<content>"): ContentResult {
  const lines = source.split("\n");
  const close = lines[0]?.trimEnd() === "---" ? lines.findIndex((line, i) => i > 0 && line.trimEnd() === "---") : -1;
  const hasFront = close > 0;

  const front = hasFront ? convertFront(lines.slice(1, close), 2, file) : { lines: [], changes: [], reports: [] };
  const bodyLine0 = hasFront ? close + 1 : 0;
  const body = convertBody(hasFront ? lines.slice(close + 1).join("\n") : source, bodyLine0, file);

  const head = hasFront ? [lines[0]!, ...front.lines, lines[close]!].join("\n") + "\n" : "";
  const text = head + body.text;
  return {
    text,
    changes: [...front.changes, ...body.changes],
    reports: [...front.reports, ...body.reports],
  };
}

export function migrateContentFile(file: string): ContentResult {
  return migrateContent(readFileSync(file, "utf8"), file);
}

const root = fileURLToPath(new URL("../..", import.meta.url));
const navigationSchema = JSON.parse(readFileSync(join(root, "schema/navigation.schema.json"), "utf8"));
const validateNavigation = new Ajv2020({ allErrors: true }).compile(navigationSchema);

/**
 * Checks a `_data/navigation.yml` against the engine's schema. Each problem is reported at the line of the
 * node that breaks it; nothing is rewritten, so a URL like `docs/x` is for a person to fix.
 */
export function checkNavigation(source: string, file: string): ContentNote[] {
  const doc = parseDocument(source);
  if (doc.errors.length) {
    return doc.errors.map((error) => ({ file, line: error.linePos?.[0]?.line ?? 1, note: `YAML: ${error.message}` }));
  }
  if (validateNavigation(doc.toJS())) return [];

  const lineAt = (offset: number) => source.slice(0, offset).split("\n").length;
  const errors = (validateNavigation.errors ?? []).filter((error) => error.keyword !== "oneOf" && error.keyword !== "anyOf");
  // A group matches one of two shapes, so Ajv reports the other shape's errors at the same node. Keep the
  // error at the deepest node, and one per node: that is the one the author meant.
  const deeper = (path: string, other: string) => other.length > path.length && other.startsWith(`${path}/`);
  const kept = errors.filter((error) => !errors.some((other) => deeper(error.instancePath, other.instancePath)));
  const firstPerNode = kept.filter((error, i) => kept.findIndex((e) => e.instancePath === error.instancePath) === i);
  return firstPerNode.map((error) => {
      const path = error.instancePath
        .split("/")
        .filter(Boolean)
        .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
      const node = path.length > 0 ? doc.getIn(path, true) : doc.contents;
      const offset = (node as { range?: number[] } | null | undefined)?.range?.[0];
      return {
        file,
        line: offset === undefined ? 1 : lineAt(offset),
        note: `${error.instancePath || "the file"} ${error.message}`,
      };
    });
}
