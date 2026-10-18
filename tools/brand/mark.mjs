// Slipway mark geometry and brand tokens. Single source for every generated brand asset.
// The mark is two concentric rings cut by one diagonal slip: light above the slip, bronze below it.
// It follows the ring family of Seaworthy and Evergreen on a 256 px canvas (docs/adr/0005-brand-mark-and-palette.md).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const BRAND_DIR = join(here, "..", "..", "brand");
export const tokens = JSON.parse(readFileSync(join(BRAND_DIR, "tokens.json"), "utf8"));

const c = (name) => tokens.colors[name].value;

/** Colorways. `above` paints the part of the mark above the slip, `below` the part under it. */
export const VARIANTS = {
  dark: { above: c("light"), below: c("bronze"), label: "dark surface" },
  light: { above: c("canvas"), below: c("bronzeSoft"), label: "light surface" },
  mono: { above: c("light"), below: c("light"), label: "one-color, dark surface" },
  "mono-light": { above: c("canvas"), below: c("canvas"), label: "one-color, light surface" },
};

const CENTER = 128;
export const MARK = { radii: [88, 58], width: 16, angle: 35, halfGap: 9 };
/** The favicon mark: one thick ring, so every stroke and the gap stay at least 2 px wide at 16 px. */
export const FAVICON = { radii: [76], width: 36, angle: 35, halfGap: 16 };

const n = (x) => Number(x.toFixed(1));

/** The two half-planes either side of the slip, as polygon point lists, leaving `halfGap` clear on each side of the line. */
function halves({ angle, halfGap }) {
  const a = (angle * Math.PI) / 180;
  const u = [Math.cos(a), Math.sin(a)];
  const v = [-Math.sin(a), Math.cos(a)]; // normal, pointing down and to the left
  const P = (s, t) => `${n(CENTER + s * u[0] + t * v[0])},${n(CENTER + s * u[1] + t * v[1])}`;
  return {
    above: [P(-300, -halfGap), P(300, -halfGap), P(300, -300), P(-300, -300)].join(" "),
    below: [P(-300, halfGap), P(300, halfGap), P(300, 300), P(-300, 300)].join(" "),
  };
}

/**
 * SVG for the mark in a 256 × 256 box: clip paths, then the rings once in each half. Embed with a transform to place and scale it.
 * `id` keeps clip-path ids unique when several marks share one document.
 */
export function markFragment(variant, id = "m", shape = MARK) {
  const v = VARIANTS[variant];
  if (!v) throw new Error(`unknown mark variant ${variant}`);
  const h = halves(shape);
  const rings = shape.radii.map((r) => `<circle cx="${CENTER}" cy="${CENTER}" r="${r}"/>`).join("");
  return [
    `<defs><clipPath id="${id}-above"><polygon points="${h.above}"/></clipPath><clipPath id="${id}-below"><polygon points="${h.below}"/></clipPath></defs>`,
    `<g fill="none" stroke-width="${shape.width}">`,
    `<g clip-path="url(#${id}-above)" stroke="${v.above}">${rings}</g>`,
    `<g clip-path="url(#${id}-below)" stroke="${v.below}">${rings}</g>`,
    `</g>`,
  ].join("");
}

export function markSvg(variant) {
  const v = VARIANTS[variant];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title">`,
    `<title id="title">Slipway mark (${v.label})</title>`,
    markFragment(variant),
    `</svg>`,
    ``,
  ].join("\n");
}

/** The favicon: the thick single-ring mark on a dark tile. `rounded` is for browser tabs; the square one is full-bleed for system icons. */
export function faviconSvg({ rounded }) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title">`,
    `<title id="title">Slipway</title>`,
    `<rect width="256" height="256"${rounded ? ' rx="56"' : ""} fill="${c("canvas")}"/>`,
    markFragment("dark", "f", FAVICON),
    `</svg>`,
    ``,
  ].join("\n");
}

export function tokensCss() {
  const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  const lines = [":root {"];
  for (const [name, { value }] of Object.entries(tokens.colors)) lines.push(`  --slipway-color-${kebab(name)}: ${value.toLowerCase()};`);
  lines.push("");
  lines.push(`  --slipway-font-sans: ${tokens.fonts.sans};`);
  lines.push(`  --slipway-font-mono: ${tokens.fonts.mono};`);
  lines.push("");
  for (const [k, v] of Object.entries(tokens.spacing)) lines.push(`  --slipway-space-${k}: ${v}px;`);
  lines.push("");
  for (const [k, v] of Object.entries(tokens.radius)) lines.push(`  --slipway-radius-${k}: ${v}px;`);
  lines.push("}", "");
  lines.push(
    `[data-slipway-theme="dark"] {`,
    `  --slipway-canvas: var(--slipway-color-canvas);`,
    `  --slipway-surface: var(--slipway-color-surface);`,
    `  --slipway-text: var(--slipway-color-text);`,
    `  --slipway-text-accent: var(--slipway-color-bronze);`,
    `  --slipway-text-muted: var(--slipway-color-mist);`,
    `  --slipway-line: var(--slipway-color-bronze);`,
    `}`,
    ``,
    `[data-slipway-theme="light"] {`,
    `  --slipway-canvas: var(--slipway-color-light);`,
    `  --slipway-surface: #fff;`,
    `  --slipway-text: var(--slipway-color-canvas);`,
    `  --slipway-text-accent: var(--slipway-color-ink-bronze);`,
    `  --slipway-text-muted: var(--slipway-color-ink-bronze);`,
    `  --slipway-line: var(--slipway-color-bronze-soft);`,
    `}`,
    ``,
  );
  return lines.join("\n");
}
