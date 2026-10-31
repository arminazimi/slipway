// Reads what the source map needs from a Markdown file and a built page, with no dependencies.

const frontMatter = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/;

/** Splits a file into its body and the number of lines before the body (the front matter block). */
export function splitFrontMatter(raw) {
  const block = raw.match(frontMatter);
  if (!block) return { body: raw, offset: 0 };
  return { body: raw.slice(block[0].length), offset: block[0].split("\n").length - 1 };
}

/** The `title` front matter value of a Markdown file, as written, or null. */
export function titleOf(raw) {
  const block = raw.match(frontMatter);
  if (!block) return null;
  const match = block[0].match(/^title:[ \t]*(.+)$/m);
  if (!match) return null;
  return match[1].replace(/^["']|["']$/g, "").trim() || null;
}

const fence = /^ {0,3}(`{3,}|~{3,})/;
const atx = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
const codeSpan = /(`+)[\s\S]*?\1/g;

/**
 * Every Markdown heading in a file: `{ level, line, text }` with 1-based lines.
 * Reads ATX and setext headings outside front matter and fenced code, so it can turn the
 * positions Sätteri reports (which leave out the front matter) into file lines.
 */
export function headingLines(raw) {
  const lines = raw.split(/\r?\n/);
  const { offset } = splitFrontMatter(raw);
  const headings = [];
  let open = null;
  for (let i = offset; i < lines.length; i++) {
    const marker = lines[i].match(fence);
    if (open) {
      if (marker && marker[1][0] === open[0] && marker[1].length >= open.length && !lines[i].slice(marker[0].length).trim()) open = null;
      continue;
    }
    if (marker) {
      open = marker[1];
      continue;
    }
    const hash = lines[i].match(atx);
    if (hash) {
      headings.push({ level: hash[1].length, line: i + 1, text: (hash[2] ?? "").replace(/[ \t]+#+[ \t]*$/, "").trim() });
      continue;
    }
    const underline = lines[i].match(/^ {0,3}(=+|-+)[ \t]*$/);
    if (underline && i > offset && lines[i - 1].trim() && !atx.test(lines[i - 1])) {
      headings.push({ level: underline[1][0] === "=" ? 1 : 2, line: i, text: lines[i - 1].trim() });
    }
  }
  return headings;
}
const inlineLink = /(!?)\[(?:[^[\]\n]|\[[^[\]\n]*\])*\]\(\s*<?([^\s<>()]+(?:\([^\s()]*\)[^\s<>()]*)*)>?(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\s*\)/g;

/** Inline links, `[text](href)`, outside front matter, fenced code, and code spans, with their 1-based lines. Images are left out. */
export function linksIn(raw) {
  const lines = raw.split(/\r?\n/);
  const { offset } = splitFrontMatter(raw);
  const links = [];
  let open = null;
  for (let i = offset; i < lines.length; i++) {
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

const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const decode = (text) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
    if (name[0] !== "#") return entities[name.toLowerCase()] ?? whole;
    return String.fromCodePoint(name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10));
  });

function attributes(text) {
  const result = {};
  for (const match of text.matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return result;
}

/** The heading's text as the page shows it: no tags, entities decoded. */
function plainText(html) {
  const visible = html.replace(/<[^>]+>/g, "");
  return decode(visible).replace(/\s+/g, " ").trim();
}

/** Every `h1` to `h6` in a built page: `{ level, id, source, text }`, where `source` is its `data-source` attribute. */
export function headingsIn(html) {
  return [...html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)].map((match) => {
    const attrs = attributes(match[2]);
    return { level: Number(match[1]), id: attrs.id, source: attrs["data-source"], text: plainText(match[3]) };
  });
}
