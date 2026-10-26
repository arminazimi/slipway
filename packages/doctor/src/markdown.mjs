// Just enough Markdown for AGENTS.md: code spans, fenced blocks, headings, and list items.

const fence = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)/;

/** Splits Markdown into prose lines and fenced code blocks, keeping 1-based line numbers. */
export function blocks(source) {
  const prose = [];
  const fences = [];
  let open = null;
  source.split(/\r?\n/).forEach((text, index) => {
    const line = index + 1;
    const match = fence.exec(text);
    if (open) {
      if (match && match[1][0] === open.marker[0] && match[1].length >= open.marker.length && !match[2]) {
        fences.push(open);
        open = null;
      }
      return;
    }
    if (match) open = { marker: match[1], info: match[2].toLowerCase(), line };
    else prose.push({ line, text });
  });
  if (open) fences.push(open);
  return { prose, fences };
}

/** Inline code spans outside fenced blocks, with their lines. */
export function codeSpans(source) {
  const spans = [];
  for (const { line, text } of blocks(source).prose) {
    for (const match of text.matchAll(/(`+)(?!`)(.+?)(?<!`)\1(?!`)/g)) {
      const value = match[2].replace(/^ (.*) $/, "$1");
      if (value.trim()) spans.push({ line, value });
    }
  }
  return spans;
}

/** ATX headings and whether a list item follows each one before the next heading. */
export function headings(source) {
  const result = [];
  for (const { line, text } of blocks(source).prose) {
    const heading = /^ {0,3}#{1,6}\s+(.*?)\s*#*\s*$/.exec(text);
    if (heading) result.push({ line, text: heading[1], hasList: false });
    else if (result.length && /^\s*([-*+]|\d+[.)])\s+\S/.test(text)) result.at(-1).hasList = true;
  }
  return result;
}
