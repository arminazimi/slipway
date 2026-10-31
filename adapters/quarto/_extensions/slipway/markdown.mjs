// Reads what the source map needs from a Quarto source file and a built page, with no dependencies.

const frontMatter = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/;

/** Splits a file into its front matter text, its body, and the number of lines before the body. */
export function splitFrontMatter(raw) {
  const block = raw.match(frontMatter);
  if (!block) return { frontMatter: "", body: raw, offset: 0 };
  return { frontMatter: block[0], body: raw.slice(block[0].length), offset: block[0].split("\n").length - 1 };
}

const fence = /^ {0,3}(`{3,}|~{3,})/;
const codeSpan = /(`+)[\s\S]*?\1/g;
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

/** The page title from its YAML front matter, or null when it has none. */
export function titleOf(raw) {
  const { frontMatter: block } = splitFrontMatter(raw);
  const match = block.match(/^title:[ \t]*(.+?)[ \t]*$/m);
  return match ? match[1].replace(/^["']|["']$/g, "") : null;
}

/** The twin's URL path: the page's address with `.md` instead of `.html`, or `index.md` under an address that ends in `/`. */
export const twinUrl = (url) => (url.endsWith("/") ? `${url}index.md` : `${url.replace(/\.html$/, "")}.md`);

/** The twin: the page's Markdown as written, without front matter, under a title heading unless it starts with one. */
export function twinOf(raw, title) {
  const body = splitFrontMatter(raw).body.replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
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

/** The heading's text as the page shows it: no tags, entities decoded, without Quarto's anchor link. */
function plainText(html) {
  const visible = html
    .replace(/<a\b[^>]*class="[^"]*\banchor\b[^"]*"[^>]*>[\s\S]*?<\/a>/g, "")
    .replace(/<a\b[^>]*class="[^"]*\bheader-anchor\b[^"]*"[^>]*>[\s\S]*?<\/a>/g, "")
    .replace(/<[^>]+>/g, "");
  return decode(visible).replace(/​/g, "").replace(/\s+/g, " ").trim();
}

/** Every `h1` to `h6` in a built page: `{ level, id, source, text }`, where `source` is its `data-source` attribute. */
export function headingsIn(html) {
  return [...html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)].map((match) => {
    const attrs = attributes(match[2]);
    return { level: Number(match[1]), id: attrs.id, source: attrs["data-source"], text: plainText(match[3]) };
  });
}
