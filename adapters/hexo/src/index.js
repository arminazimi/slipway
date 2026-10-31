// Slipway's Hexo plugin: a script for the site's scripts/ folder (or a plugin package) that writes
// /sourcemap.json and a Markdown twin of every page, and puts data-source="<source>:<line>" on every
// Markdown heading. It registers three filters:
//   after_post_render: adds data-source to the headings of the rendered content;
//   after_render:html: links each page to its Markdown twin from <head>;
//   after_generate: builds the map from the rendered routes and adds the twins and the map as routes.
// It has no dependencies of its own.

const { join, relative, sep } = require("node:path");

const markdown = /\.(md|markdown)$/i;

const toPosix = (path) => path.split(sep).join("/");
const inside = (path) => Boolean(path) && !path.startsWith("..") && !/^([A-Za-z]:)?[\\/]/.test(path);

/** A path value as an HTML attribute. */
const attribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const frontMatter = /^---[ \t]*\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/;

/** Splits a file into its body and the number of lines before the body (the front matter block). */
function splitFrontMatter(raw) {
  const block = raw.match(frontMatter);
  if (!block) return { body: raw, offset: 0 };
  return { body: raw.slice(block[0].length), offset: block[0].split("\n").length - 1 };
}

/** The twin's URL path: the page's address with `.md` instead of `.html`, or `index.md` under an address that ends in `/`. */
function twinUrl(url) {
  return url.endsWith("/") ? `${url}index.md` : `${url.replace(/\.html$/, "")}.md`;
}

/** The twin: the page's Markdown as written, without front matter, under a title heading unless it starts with one. */
function twinOf(raw, title) {
  const body = splitFrontMatter(raw).body.replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
}

/** The URL path for a route: no leading slash is added twice, and a trailing `index.html` is dropped. */
function urlOf(path) {
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/(^|\/)index\.html$/, "$1");
}

const fence = /^ {0,3}(`{3,}|~{3,})/;
/** A heading's text without its closing hashes and inline markup, enough to read it in the source. */
const plainSource = (text) =>
  text
    .replace(/[ \t]+#+[ \t]*$/, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .trim();

/**
 * The Markdown headings in a file, in document order, as `{ level, line, text }` with 1-based lines
 * counted from the top of the file (front matter included). Fenced code and blockquote markers are
 * handled; headings written as raw HTML are not.
 */
function sourceHeadings(raw) {
  const lines = raw.split(/\r?\n/);
  const headings = [];
  let open = null;
  for (let i = splitFrontMatter(raw).offset; i < lines.length; i++) {
    const marker = lines[i].match(fence);
    if (open) {
      if (marker && marker[1][0] === open[0] && marker[1].length >= open.length && !lines[i].slice(marker[0].length).trim()) open = null;
      continue;
    }
    if (marker) {
      open = marker[1];
      continue;
    }
    const text = lines[i].replace(/^(?: {0,3}> ?)+/, "");
    const atx = text.match(/^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/);
    if (atx) {
      headings.push({ level: atx[1].length, line: i + 1, text: plainSource(atx[2] ?? "") });
      continue;
    }
    const underline = i + 1 < lines.length ? lines[i + 1].match(/^ {0,3}(=+|-+)[ \t]*$/) : null;
    if (underline && text.trim() && !/^ {0,3}([-*+]|\d+[.)])[ \t]/.test(text)) {
      headings.push({ level: underline[1][0] === "=" ? 1 : 2, line: i + 1, text: plainSource(text) });
      i++;
    }
  }
  return headings;
}

/**
 * Adds `data-source` to the rendered headings that came from `headings`, pairing them in order and by
 * level. Raw HTML headings and headings the renderer dropped keep no attribute.
 */
function addSources(html, headings, source) {
  let index = 0;
  return html.replace(/<h([1-6])(\s[^>]*)?>/gi, (tag, level, attrs = "") => {
    const heading = headings[index];
    if (!heading || heading.level !== Number(level)) return tag;
    index++;
    if (/\bdata-source\s*=/i.test(attrs)) return tag;
    return `<h${level}${attrs} data-source="${attribute(`${source}:${heading.line}`)}">`;
  });
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

/** The heading's text as the page shows it: no tags, entities decoded, without an empty hash-link anchor. */
function plainText(html) {
  const visible = html.replace(/<a\b[^>]*class="[^"]*\bheaderlink\b[^"]*"[^>]*>[\s\S]*?<\/a>/g, "").replace(/<[^>]+>/g, "");
  return decode(visible).replace(/\u200b/g, "").replace(/\s+/g, " ").trim();
}

/** Every `h1` to `h6` in a built page: `{ level, id, source, text }`, where `source` is its `data-source` attribute. */
function headingsIn(html) {
  return [...html.matchAll(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)].map((match) => {
    const attrs = attributes(match[2]);
    return { level: Number(match[1]), id: attrs.id, source: attrs["data-source"], text: plainText(match[3]) };
  });
}

const inlineLink = /(!?)\[(?:[^[\]\n]|\[[^[\]\n]*\])*\]\(\s*<?([^\s<>()]+(?:\([^\s()]*\)[^\s<>()]*)*)>?(?:\s+(?:"[^"\n]*"|'[^'\n]*'))?\s*\)/g;
const codeSpan = /(`+)[\s\S]*?\1/g;

/** Inline links, `[text](href)`, outside front matter, fenced code, and code spans, with their 1-based lines. Images are left out. */
function linksIn(raw) {
  const lines = raw.split(/\r?\n/);
  const links = [];
  let open = null;
  for (let i = splitFrontMatter(raw).offset; i < lines.length; i++) {
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

/** A page's source path from the site root: `source/_posts/hello.md` for Hexo's `_posts/hello.md`. */
function sourceOf(hexo, data) {
  const file = data.full_source ?? (data.source && join(hexo.source_dir, data.source));
  if (!file) return null;
  const path = toPosix(relative(hexo.base_dir, file));
  return inside(path) && markdown.test(path) ? path : null;
}

/** Reads a rendered route as text, or null when Hexo has no such route. */
function readRoute(hexo, path) {
  return new Promise((resolve, reject) => {
    const stream = hexo.route.get(path);
    if (!stream) return resolve(null);
    let text = "";
    stream.on("data", (chunk) => (text += chunk));
    stream.on("end", () => resolve(text));
    stream.on("error", reject);
  });
}

/** Registers the filters on a Hexo instance. */
function register(hexo) {
  const root = (hexo.config.root || "/").replace(/\/+$/, "");
  const urlFor = (path) => `${root}${twinUrl(urlOf(path))}`;

  hexo.extend.filter.register("after_post_render", (data) => {
    if (!data || typeof data.content !== "string" || typeof data.raw !== "string") return data;
    const source = sourceOf(hexo, data);
    if (!source) return data;
    const headings = sourceHeadings(data.raw);
    if (headings.length) data.content = addSources(data.content, headings, source);
    return data;
  });

  hexo.extend.filter.register("after_render:html", (html, locals) => {
    const page = locals?.page;
    const path = locals?.path;
    if (!page || !path || page.layout === false || typeof html !== "string") return html;
    if (!sourceOf(hexo, page) || !/<\/head>/i.test(html)) return html;
    const tag = `<link rel="alternate" type="text/markdown" href="${attribute(urlFor(path))}">`;
    if (html.includes(tag)) return html;
    return html.replace(/<\/head>/i, `\n  ${tag}\n</head>`);
  });

  hexo.extend.filter.register("after_generate", async () => {
    const pages = [];
    const seen = new Set();
    const content = [...hexo.locals.get("posts").toArray(), ...hexo.locals.get("pages").toArray()];
    for (const data of content) {
      const source = sourceOf(hexo, data);
      if (!source || typeof data.raw !== "string" || typeof data.path !== "string") continue;
      const url = urlOf(data.path);
      if (seen.has(url)) continue;
      seen.add(url);
      const html = await readRoute(hexo, data.path);
      const found = html == null ? [] : headingsIn(html);
      const sections = found
        .filter((heading) => heading.id && heading.source?.startsWith(`${source}:`))
        .map((heading) => ({ id: heading.id, level: heading.level, line: Number(heading.source.slice(source.length + 1)), text: heading.text }))
        .filter((section) => Number.isInteger(section.line) && section.line > 0);
      pages.push({ url, source, sections, links: linksIn(data.raw) });
      if (html != null) hexo.route.set(twinUrl(url), twinOf(data.raw, data.title));
    }
    pages.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
    hexo.route.set("sourcemap.json", `${JSON.stringify({ version: 0, pages }, null, 2)}\n`);
  });
}

module.exports = { addSources, headingsIn, linksIn, register, sourceHeadings, splitFrontMatter, twinOf, twinUrl, urlOf };

// Hexo runs a scripts/ file inside a function that receives the Hexo instance as `hexo`; a plain
// require, as in the adapter's tests, has no such name and only gets the helpers above.
if (typeof hexo !== "undefined") register(hexo);
