// Start tags and their attributes, enough to find headings by id in built HTML. Not a full parser.

const tag = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/g;
const attribute = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

/** Every start tag outside comments, scripts, and styles: `{ name, attributes }`, names lowercased. */
export function startTags(html) {
  const text = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, (match) => match.slice(0, match.indexOf(">") + 1));
  const tags = [];
  for (const match of text.matchAll(tag)) {
    const attributes = new Map();
    for (const [, name, double, single, bare] of (match[2] ?? "").matchAll(attribute)) {
      const key = name.toLowerCase();
      if (!attributes.has(key)) attributes.set(key, decode(double ?? single ?? bare ?? ""));
    }
    tags.push({ name: match[1].toLowerCase(), attributes });
  }
  return tags;
}

const voids = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const rawText = new Set(["script", "style", "textarea", "title"]);
const token = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\?[^>]*>|<\/([a-zA-Z][a-zA-Z0-9-]*)[^>]*>|<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g;

function attributesOf(text) {
  const attributes = new Map();
  for (const [, name, double, single, bare] of (text ?? "").matchAll(attribute)) {
    const key = name.toLowerCase();
    if (!attributes.has(key)) attributes.set(key, decode(double ?? single ?? bare ?? ""));
  }
  return attributes;
}

/**
 * A tree of elements and text: `{ name, attributes, line, children }`, where a child is an element or
 * `{ text }`, decoded. The root has the name `#document`. An end tag closes the nearest open element
 * with its name and anything opened inside it; a stray end tag is ignored. `script`, `style`,
 * `textarea`, and `title` hold text only. Lines are 1-based.
 */
export function parse(html) {
  const root = { name: "#document", attributes: new Map(), line: 1, children: [] };
  const open = [root];
  let line = 1;
  let at = 0;
  const advance = (to) => {
    for (let i = at; i < to; i++) if (html.charCodeAt(i) === 10) line++;
    at = to;
  };
  const text = (value) => value && open.at(-1).children.push({ text: decode(value) });
  token.lastIndex = 0;
  let match;
  while ((match = token.exec(html))) {
    text(html.slice(at, match.index));
    advance(match.index);
    const [whole, end, start, attrs, selfClosing] = match;
    if (end) {
      const name = end.toLowerCase();
      const index = open.findLastIndex((element) => element.name === name);
      if (index > 0) open.length = index;
    } else if (start) {
      const element = { name: start.toLowerCase(), attributes: attributesOf(attrs), line, children: [] };
      open.at(-1).children.push(element);
      if (rawText.has(element.name) && !selfClosing) {
        const close = new RegExp(`</${element.name}\\s*>`, "ig");
        close.lastIndex = match.index + whole.length;
        const found = close.exec(html);
        const stop = found ? found.index : html.length;
        const inner = html.slice(match.index + whole.length, stop);
        if (inner) element.children.push({ text: element.name === "title" || element.name === "textarea" ? decode(inner) : inner });
        advance(found ? found.index + found[0].length : html.length);
        token.lastIndex = at;
        continue;
      }
      if (!voids.has(element.name) && !selfClosing) open.push(element);
    }
    advance(match.index + whole.length);
  }
  text(html.slice(at));
  return root;
}

/** Every element in a tree, depth first, each with its `ancestors` (nearest last). */
export function* walk(node, ancestors = []) {
  for (const child of node.children ?? []) {
    if (child.text !== undefined) continue;
    yield { element: child, ancestors };
    yield* walk(child, [...ancestors, child]);
  }
}
