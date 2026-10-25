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
