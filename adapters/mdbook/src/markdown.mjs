// Reads what the source map needs from a Markdown chapter, with no dependencies. Line numbers
// always count from the top of the source file, front matter included.

const fence = /^ {0,3}(`{3,}|~{3,})/;
const codeSpan = /(`+)[\s\S]*?\1/g;
const inlineLink = /(!?)\[(?:[^[\]\n]|\[[^[\]\n]*\])*\]\(\s*<?([^\s<>()]+(?:\([^\s()]*\)[^\s<>()]*)*)>?(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\s*\)/g;

/** A heading's text without the optional closing `#`s of an ATX heading. */
function headingText(text) {
  return text.replace(/[ \t]+#+[ \t]*$/, "").replace(/\s+/g, " ").trim();
}

/**
 * The line after a front matter block that starts the file: YAML (`---`) or TOML (`+++`), closed
 * by the same delimiter. It is 0 when the file has none, so every line is content.
 */
export function frontMatterEnd(lines) {
  const first = lines[0]?.trimEnd();
  if (first !== "---" && first !== "+++") return 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === first) return i + 1;
  }
  return 0;
}

/** The Markdown without a front matter block, if it has one. */
export function withoutFrontMatter(text) {
  const lines = text.split(/\r?\n/);
  return lines.slice(frontMatterEnd(lines)).join("\n");
}

/**
 * Every heading in a chapter, in document order: `{ level, text, line }`. It reads ATX headings
 * (`## Title`) and setext headings (a line underlined with `=` or `-`) outside front matter and
 * fenced code blocks, the two forms mdBook renders. Headings inside blockquotes and lists are left out.
 */
export function headingsIn(text) {
  const lines = text.split(/\r?\n/);
  const headings = [];
  let open = null;
  for (let i = frontMatterEnd(lines); i < lines.length; i++) {
    const line = lines[i];
    const marker = line.match(fence);
    if (open) {
      if (marker && marker[1][0] === open[0] && marker[1].length >= open.length && !line.slice(marker[0].length).trim()) open = null;
      continue;
    }
    if (marker) {
      open = marker[1];
      continue;
    }
    const atx = line.match(/^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/);
    if (atx) {
      headings.push({ level: atx[1].length, text: headingText(atx[2] ?? ""), line: i + 1 });
      continue;
    }
    if (
      i + 1 < lines.length &&
      /^ {0,3}(=+|-+)[ \t]*$/.test(lines[i + 1]) &&
      line.trim() &&
      !/^ {0,3}([-*+]|\d+[.)])[ \t]/.test(line) &&
      !/^ {0,3}([#>|<])/.test(line) &&
      !/^ {0,3}\[[^\]]+\]:/.test(line)
    ) {
      headings.push({ level: lines[i + 1].trim()[0] === "=" ? 1 : 2, text: headingText(line), line: i + 1 });
      i++;
    }
  }
  return headings;
}

/** Inline links, `[text](href)`, outside front matter, fenced code, and code spans, with their 1-based lines. Images are left out. */
export function linksIn(raw) {
  const lines = raw.split(/\r?\n/);
  const links = [];
  let open = null;
  for (let i = frontMatterEnd(lines); i < lines.length; i++) {
    const marker = lines[i].match(fence);
    if (open) {
      if (marker && marker[1][0] === open[0] && marker[1].length >= open.length && !lines[i].slice(marker[0].length).trim()) open = null;
      continue;
    }
    if (marker) {
      open = marker[1];
      continue;
    }
    for (const match of lines[i].replace(codeSpan, (span) => " ".repeat(span.length)).matchAll(inlineLink)) {
      if (!match[1]) links.push({ href: match[2], line: i + 1 });
    }
  }
  return links;
}

/**
 * The chapter with an HTML comment marker before every heading that also exists in its source
 * file: `<!-- slipway:6 -->`. mdBook expands `{{#include}}` before a preprocessor sees the
 * chapter, so a heading that came from an included file gets no marker; it is not part of this
 * page. The renderer removes the markers after it reads them.
 */
export function annotate(content, source) {
  const lines = content.split(/\r?\n/);
  const own = headingsIn(content);
  const headings = source === null || source === undefined ? own : headingsIn(source);
  const markers = new Map();
  let next = 0;
  for (const heading of own) {
    let found = -1;
    for (let i = next; i < headings.length; i++) {
      if (headings[i].level === heading.level && headings[i].text === heading.text) {
        found = i;
        break;
      }
    }
    if (found === -1) continue;
    markers.set(heading.line, headings[found].line);
    next = found + 1;
  }
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    if (markers.has(i + 1)) result.push(`<!-- slipway:${markers.get(i + 1)} -->`);
    result.push(lines[i]);
  }
  return result.join("\n");
}

/** The page's URL: its file with `.html` instead of `.md`, from the site root, as mdBook links it. */
export function pageUrl(path) {
  const posix = path.split("\\").join("/").replace(/^\.\//, "");
  return `/${posix.replace(/\.md$/i, ".html")}`;
}

/** The twin's URL: the page's address with `.md` instead of `.html`. */
export const twinUrl = (url) => url.replace(/\.html$/i, ".md");

/** The twin's file, relative to the output folder. */
export const twinPath = (path) => path.replace(/\.html$/i, ".md");

/** The twin: the chapter's Markdown as written but without front matter, under the chapter's title unless it starts with a heading. */
export function twinOf(raw, title) {
  const body = withoutFrontMatter(raw).replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
}

/** A source path relative to the book root: `src` is the configured source folder. */
export function sourcePathOf(sourceDir, path) {
  const base = sourceDir.split("\\").join("/").replace(/\/+$/, "");
  return base && base !== "." ? `${base}/${path}` : path;
}
