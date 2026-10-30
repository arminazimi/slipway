// Reads one section of a page: from its heading to the next heading of the same or higher level.
import { readFileSync, realpathSync } from "node:fs";
import { relative, sep } from "node:path";
import { blocks } from "../../../doctor/src/markdown.mjs";
import { insideSite } from "../tools.mjs";
import { sourceForUrl } from "./source_for_url.mjs";

export const definition = {
  name: "read_section",
  description: "Read one section of a page: the Markdown from a heading to the next heading of the same or higher level, with its start and end lines. It reads only inside the site directory the server was given, and its output is JSON with file paths and lines where they apply.",
  inputSchema: {
    type: "object",
    properties: {
      file: { type: "string", description: "The page file, relative to the site directory." },
      heading: { type: "string", description: "The heading text of the section to read." },
      line: { type: "string", description: "A line number in the page, as a string (e.g. \"42\"); the section that holds it is returned." },
      url: { type: "string", description: "The URL path of the page from the site root (e.g. /guide/configure/)." },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

const markdownFile = /\.(md|markdown)$/i;
const headingPattern = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;

/** The headings of a Markdown source, with their level, text, and line. Fenced code is not a heading. */
function headingsOf(source) {
  const headings = [];
  for (const { line, text } of blocks(source).prose) {
    const match = headingPattern.exec(text);
    if (match) headings.push({ level: match[1].length, text: match[2].trim(), line });
  }
  return headings;
}

/** A heading's text and the slug a build gives it, both normalized, so either one finds the heading. */
function keys(text) {
  const plain = text.toLowerCase().replace(/\s+/g, " ").trim();
  const slug = plain.replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-");
  return [...new Set([plain, slug])];
}

/** The source file of a page, by URL or by path. */
function pageFile(siteDir, { url, file }) {
  if (!url) return file;
  if (/(^|\/)\.\.(\/|$)/.test(url.split(/[?#]/)[0])) throw new Error(`${url} is outside the site directory`);
  const found = sourceForUrl(siteDir, { url });
  if (!found.file) throw new Error(`no page at ${url}`);
  return found.file;
}

/** One section of a Markdown page: its heading, its lines, and its text. */
export function readSection(siteDir, args = {}) {
  const { file, heading, line, url } = args;

  if (!url && !file) throw new Error("read_section needs a url or a file");
  if (url && file) throw new Error("give either a url or a file, not both");
  if (!heading && !line) throw new Error("read_section needs a heading or a line");
  if (heading && line) throw new Error("give either a heading or a line, not both");

  const absolute = insideSite(siteDir, pageFile(siteDir, { url, file }));
  const path = relative(realpathSync(siteDir), absolute).split(sep).join("/");
  if (!markdownFile.test(path)) throw new Error(`${path} is not a Markdown file`);

  const source = readFileSync(absolute, "utf8");
  const lines = source.split(/\r?\n/);
  const headings = headingsOf(source);

  let index;
  if (heading) {
    const wanted = keys(heading);
    const found = headings.filter((entry) => keys(entry.text).some((key) => wanted.includes(key)));
    if (found.length === 0) throw new Error(`no heading "${heading}" in ${path}`);
    if (found.length > 1) throw new Error(`more than one heading matches "${heading}" in ${path} (lines ${found.map((entry) => entry.line).join(", ")}); use a line instead`);
    index = headings.indexOf(found[0]);
  } else {
    const number = Number(line);
    if (!Number.isInteger(number) || number < 1) throw new Error("line must be a number");
    if (number > lines.length) throw new Error(`line ${number} is past the end of ${path}`);
    index = -1;
    for (const [i, entry] of headings.entries()) {
      if (entry.line > number) break;
      index = i;
    }
    if (index < 0) throw new Error(`line ${number} is before the first heading of ${path}`);
  }

  const start = headings[index];
  let end = lines.length;
  for (let i = index + 1; i < headings.length; i++) {
    if (headings[i].level <= start.level) {
      end = headings[i].line - 1;
      break;
    }
  }
  while (end > start.line && lines[end - 1].trim() === "") end--;

  return {
    file: path,
    heading: start.text,
    level: start.level,
    startLine: start.line,
    endLine: end,
    markdown: lines.slice(start.line - 1, end).join("\n"),
  };
}

export const handler = (site, args) => readSection(site, args);
