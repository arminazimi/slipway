// Turns the markers a preprocessor left in mdBook's HTML into data-source attributes and sections,
// with no dependencies.

const marker = /<!--\s*slipway:(\d+)\s*-->/g;
const heading = /<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1>/g;

const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

const decode = (text) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) => {
    if (name[0] !== "#") return entities[name.toLowerCase()] ?? whole;
    return String.fromCodePoint(name[1].toLowerCase() === "x" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10));
  });

/** An element's attribute value, decoded, or null when it has none. */
export function attribute(attrs, name) {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? decode(match[1] ?? match[2] ?? match[3]) : null;
}

/** The heading's text as the page shows it: no tags, entities decoded, without mdBook's "#" link markup. */
export function plainText(html) {
  return decode(html.replace(/<[^>]*>/g, "")).replace(/​/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Adds `data-source="<source>:<line>"` to the heading after each marker, removes the markers, and
 * returns the changed HTML with the headings as sections. A marker with no heading after it is
 * removed and adds no section.
 */
export function applyMarkers(html, source) {
  const markers = [...html.matchAll(marker)];
  const headings = [...html.matchAll(heading)];
  const sections = [];
  let next = 0;
  let last = 0;
  let result = "";
  for (const found of markers) {
    result += html.slice(last, found.index);
    while (next < headings.length && headings[next].index < found.index) next++;
    if (next === headings.length) {
      last = found.index + found[0].length;
      continue;
    }
    const tag = headings[next];
    const line = Number(found[1]);
    const id = attribute(tag[2], "id");
    const attrs = tag[2].replace(/\sdata-source="[^"]*"/gi, "");
    result += `<h${tag[1]}${attrs} data-source="${source}:${line}">${tag[3]}</h${tag[1]}>`;
    if (id) sections.push({ id, level: Number(tag[1]), line, text: plainText(tag[3]) });
    last = tag.index + tag[0].length;
    next++;
  }
  return { html: result + html.slice(last), sections };
}

/** Removes every source marker without adding anything, for pages that are not in the map. */
export const stripMarkers = (html) => html.replace(marker, "");
