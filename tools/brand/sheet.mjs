// The logo review sheet: dark, light, and one-color lockups, small-size checks, and the palette.

import { markFragment, tokens } from "./mark.mjs";

const color = (name) => tokens.colors[name].value;
const SANS = "Inter Variable, Inter, Helvetica Neue, Arial, sans-serif";
const MONO = "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace";

const sans = (x, y, size, fill, spacing, content) => `<text x="${x}" y="${y}" fill="${fill}" font-family="${SANS}" font-size="${size}" font-weight="700" letter-spacing="${spacing}">${content}</text>`;
const mono = (x, y, size, fill, spacing, content) => `<text x="${x}" y="${y}" fill="${fill}" font-family="${MONO}" font-size="${size}" letter-spacing="${spacing}">${content}</text>`;

let counter = 0;
const place = (variant, x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})">${markFragment(variant, `s${counter++}`)}</g>`;

export function logoSheet() {
  counter = 0;
  const lockup = (variant, bg, text, accent, muted, x) => [
    place(variant, x, 150, 0.95),
    sans(x + 263, 276, 50, text, 5, "SLIPWAY"),
    mono(x + 265, 312, 13, accent, 1.5, tokens.tagline.toUpperCase()),
    mono(x + 265, 336, 13, muted, 1.5, tokens.taglineSecondary.toUpperCase()),
  ];
  const swatch = (name, cx) => [`<circle cx="${cx}" cy="710" r="30" fill="${color(name)}" stroke="#4a4036" stroke-width="1"/>`, mono(cx - 36, 770, 12, color("mist"), 0, color(name))];
  const names = ["canvas", "surface", "bronze", "bronzeSoft", "inkBronze", "tint", "light", "text", "mist"];
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-labelledby="title">`,
    `<title id="title">Slipway logo system review sheet</title>`,
    `<rect width="1600" height="900" fill="#0C0906"/>`,
    `<rect x="40" y="40" width="740" height="510" rx="24" fill="${color("canvas")}"/>`,
    `<rect x="820" y="40" width="740" height="510" rx="24" fill="${color("light")}"/>`,
    `<rect x="40" y="590" width="1520" height="270" rx="24" fill="${color("surface")}"/>`,
    ...lockup("dark", color("canvas"), color("light"), color("bronze"), color("mist"), 92),
    ...lockup("light", color("light"), color("canvas"), color("inkBronze"), color("inkBronze"), 872),
    place("mono", 100, 625, 0.72),
    place("dark", 335, 680, 0.3125),
    place("dark", 455, 712, 0.15625),
    mono(340, 815, 14, color("mist"), 0, "80px"),
    mono(462, 815, 14, color("mist"), 0, "40px"),
    ...names.flatMap((name, i) => swatch(name, 640 + i * 100)),
    `</svg>`,
    ``,
  ].join("\n");
}
