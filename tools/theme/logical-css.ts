// Lints the theme stylesheets for physical (left/right) CSS. Right-to-left is first class, so every
// rule uses logical properties (margin-inline-start, inset-inline-end, text-align: start).
// overflow-x/y stay: overflow-inline has no Safari support yet.

const physical = [
  /\b(margin|padding|border|scroll-margin|scroll-padding)-(left|right|top|bottom)\b/,
  /\bborder-(top|bottom)-(left|right)-radius\b/,
  /(^|[;{\s])(left|right|top|bottom)\s*:/,
  /\btext-align\s*:\s*(left|right)\b/,
  /\bfloat\s*:\s*(left|right)\b/,
  /\bclear\s*:\s*(left|right)\b/,
  /(?<![\w-])(min-|max-)?(width|height)\s*:/,
];

/** Returns "file:line: text" for every declaration that uses a physical property. */
export function findPhysical(css, name = "css") {
  const found = [];
  const body = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  body.split("\n").forEach((line, i) => {
    if (/^\s*@(media|container|supports)/.test(line)) return;
    if (physical.some((re) => re.test(line))) found.push(`${name}:${i + 1}: ${line.trim()}`);
  });
  return found;
}
