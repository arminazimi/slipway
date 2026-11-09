// The text a typography rule may judge: prose runs from a Markdown file, with the line and column
// they start at. Fenced and inline code, front matter, HTML tags and attributes, URLs, images, and
// Liquid tags are not prose, and neither are the markers that make a line a heading, a quote, or a
// list item. The engine's own Markdown adds directive fences and their attributes, text-directive
// attributes, GitHub alert markers, task-list boxes, and heading anchors; those are skipped too.
import { blocks } from "./markdown.ts";

const frontMatterEnd = (lines) => {
  if ((lines[0] ?? "").trim() !== "---") return 0;
  for (let i = 1; i < lines.length; i++) if (/^(---|\.\.\.)\s*$/.test(lines[i])) return i + 1;
  return 0;
};

const blockMarker = /^(?: {0,3}#{1,6}\s+| {0,3}>\s?| {0,3}(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?)/;

/**
 * A directive's fence or leaf line: three or more colons, an optional name, an optional label, and
 * optional attributes, alone on the line (`:::callout{type=warning}`, `::badge{label=new}`, `:::`).
 */
const directiveLine = /^ {0,3}:{2,}[A-Za-z][\w-]*(?:\[[^\]]*\])?(?:\{[^}]*\})?\s*$|^ {0,3}:{3,}\s*$/;

/** A GitHub alert marker alone on a blockquote line (`> [!NOTE]`), which the engine turns into a callout. */
const alertLine = /^\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*$/;

/** A trailing `{#id}` on a heading, which is an anchor, not prose. */
const headingId = /\s*\{#[^\s{}]+\}\s*$/;

/** The runs on one line, each with the 1-based column of its first character. */
function scanLine(text, line, from) {
  const runs = [];
  let run = null;
  let i = from;
  const flush = () => {
    if (!run) return;
    const leading = run.text.length - run.text.trimStart().length;
    run.text = run.text.trim();
    run.column += leading;
    if (run.text) runs.push(run);
    run = null;
  };
  const add = (char, column) => {
    run ??= { text: "", line, column };
    run.text += char;
  };
  const skip = (to) => {
    flush();
    i = to;
  };

  while (i < text.length) {
    const rest = text.slice(i);
    let match;
    if (rest.startsWith("<!--")) {
      const end = text.indexOf("-->", i + 4);
      skip(end === -1 ? text.length : end + 3);
    } else if ((match = /^(`+)[\s\S]*?\1/.exec(rest))) {
      skip(i + match[0].length);
    } else if ((match = /^\{%[\s\S]*?%\}|^\{\{[\s\S]*?\}\}/.exec(rest))) {
      skip(i + match[0].length);
    } else if ((match = /^<[^>]*>/.exec(rest))) {
      skip(i + match[0].length);
    } else if ((match = /^!\[[^\]]*\]\([^)]*\)/.exec(rest))) {
      skip(i + match[0].length);
    } else if ((match = /^\[([^\]]*)\]\([^)]*\)/.exec(rest))) {
      // The label is prose, but a code span inside it is not.
      let offset = 0;
      for (const part of match[1].split(/(`+[^`]*`+)/)) {
        if (!part.startsWith("`")) for (let k = 0; k < part.length; k++) add(part[k], i + 1 + offset + k);
        offset += part.length;
      }
      skip(i + match[0].length);
    } else if ((match = /^:([A-Za-z][\w-]*)(?:\[([^\]]*)\])?(\{[^}]*\})?/.exec(rest)) && (match[2] !== undefined || match[3] !== undefined)) {
      // A text directive (`:badge[New]{variant=tip}`): its label is prose, its name and attributes are not.
      const labelAt = match[0].indexOf("[");
      if (match[2] !== undefined) {
        let offset = 0;
        for (const part of match[2].split(/(`+[^`]*`+)/)) {
          if (!part.startsWith("`")) for (let k = 0; k < part.length; k++) add(part[k], i + labelAt + 1 + offset + k);
          offset += part.length;
        }
      }
      skip(i + match[0].length);
    } else if ((match = /^(?:https?:\/\/|mailto:|ftp:\/\/|www\.)[^\s<>()]+/.exec(rest))) {
      skip(i + match[0].length);
    } else {
      add(text[i], i + 1);
      i++;
    }
  }
  flush();
  return runs;
}

/**
 * The prose runs of a Markdown file. `file` is `{ text }`, or `{ text, lang }` where `lang` is the
 * language of the site; a `lang` in the front matter wins. Returns `{ lang, runs }`, each run
 * `{ text, line, column }` with 1-based line and column in the original file.
 */
export function prose(file) {
  const { text, lang: siteLang = null } = typeof file === "string" ? { text: file } : file;
  const lines = text.split(/\r?\n/);
  const skip = frontMatterEnd(lines);
  const from = skip ? /^lang:\s*["']?([\w-]+)["']?\s*$/m.exec(lines.slice(0, skip).join("\n")) : null;
  const lang = from ? from[1] : siteLang;
  const runs = [];
  for (const { line, text: source } of blocks(text).prose) {
    if (line <= skip || directiveLine.test(source)) continue;
    const marker = blockMarker.exec(source);
    const from = marker ? marker[0].length : 0;
    // An alert marker alone on its blockquote line is the callout's type, not text; with text after it
    // the engine keeps the line a plain blockquote, so the marker stays prose.
    if (alertLine.test(source.slice(from))) continue;
    const body = /^ {0,3}#{1,6}\s+/.test(source) ? source.replace(headingId, "") : source;
    runs.push(...scanLine(body, line, from));
  }
  return { lang, runs };
}
