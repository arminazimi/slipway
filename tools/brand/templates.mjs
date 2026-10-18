// Social brand templates: social preview, avatar, banner, and template thumbnail.
// Each function returns a complete SVG document. Presets list the PNG exports built from them.
// Same layouts as Seaworthy's and Evergreen's, so the products look like one family.

import { markFragment, tokens } from "./mark.mjs";

const color = (name) => tokens.colors[name].value;

const SANS = "Inter Variable, Inter, Helvetica Neue, Arial, sans-serif";
const MONO = "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace";

export const THEMES = {
  dark: { bg: color("canvas"), mark: "dark", text: color("light"), accent: color("bronze"), muted: color("mist"), panel: color("surface"), line: color("bronze"), soft: color("tint") },
  light: { bg: color("light"), mark: "light", text: color("canvas"), accent: color("inkBronze"), muted: color("inkBronze"), panel: "#ffffff", line: color("bronzeSoft"), soft: color("bronzeSoft") },
};

const sans = (x, y, size, fill, spacing, content) => `<text x="${x}" y="${y}" fill="${fill}" font-family="${SANS}" font-size="${size}" font-weight="700" letter-spacing="${spacing}">${content}</text>`;
const mono = (x, y, size, fill, spacing, content) => `<text x="${x}" y="${y}" fill="${fill}" font-family="${MONO}" font-size="${size}" letter-spacing="${spacing}">${content}</text>`;

let counter = 0;
const place = (variant, x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})">${markFragment(variant, `t${counter++}`)}</g>`;

function doc(w, h, title, body) {
  counter = 0;
  return [`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title">`, `<title id="title">${title}</title>`, ...body(), `</svg>`, ``].join("\n");
}

const TAGLINE = tokens.tagline.toUpperCase();
const TAGLINE_2 = tokens.taglineSecondary.toUpperCase();
const DESCRIPTOR = tokens.descriptor;

/** An abstract page, not a real screenshot: a docs layout with a sidebar, a heading, and body text, in the brand colors. */
function pageMock(t, w, h) {
  const bar = (x, y, bw, bh, fill, o = 1) => `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${Math.min(6, bh / 2)}" fill="${fill}" opacity="${o}"/>`;
  const lines = [0, 1, 2, 3, 4].map((i) => bar(430, 360 + i * 30, i === 4 ? 360 : 640, 12, t.muted, 0.55));
  const para = [0, 1, 2].map((i) => bar(430, 530 + i * 30, i === 2 ? 300 : 640, 12, t.muted, 0.4));
  const side = [0, 1, 2, 3, 4, 5].map((i) => bar(130, 270 + i * 40, i === 1 ? 150 : 110 + ((i * 37) % 50), 12, i === 1 ? t.accent : t.muted, i === 1 ? 1 : 0.5));
  return [
    `<rect width="${w}" height="${h}" fill="${t.bg}"/>`,
    `<rect x="70" y="70" width="${w - 140}" height="${h - 140}" rx="16" fill="${t.panel}" stroke="${t.line}" stroke-opacity="0.45" stroke-width="2"/>`,
    `<circle cx="112" cy="106" r="7" fill="${t.line}" opacity="0.55"/><circle cx="136" cy="106" r="7" fill="${t.line}" opacity="0.4"/><circle cx="160" cy="106" r="7" fill="${t.line}" opacity="0.25"/>`,
    `<line x1="70" y1="138" x2="${w - 70}" y2="138" stroke="${t.line}" stroke-opacity="0.35" stroke-width="2"/>`,
    place(t.mark, 100, 160, 0.3),
    bar(196, 190, 130, 14, t.text, 0.85),
    bar(w - 330, 190, 50, 12, t.muted, 0.5), bar(w - 260, 190, 50, 12, t.muted, 0.5), bar(w - 190, 190, 50, 12, t.accent),
    `<line x1="360" y1="222" x2="360" y2="${h - 100}" stroke="${t.line}" stroke-opacity="0.3" stroke-width="2"/>`,
    ...side,
    bar(430, 250, 480, 34, t.text, 0.9),
    bar(430, 304, 260, 14, t.accent),
    ...lines,
    ...para,
  ];
}

export const TEMPLATES = {
  "social-preview": (t) =>
    doc(1280, 640, "Slipway social preview", () => [
      `<rect width="1280" height="640" fill="${t.bg}"/>`,
      place(t.mark, 112, 192, 1),
      sans(420, 322, 82, t.text, 8, "SLIPWAY"),
      mono(424, 378, 24, t.accent, 2, TAGLINE),
      mono(112, 566, 20, t.muted, 0.5, DESCRIPTOR),
    ]),
  avatar: (t) => doc(512, 512, "Slipway avatar", () => [`<rect width="512" height="512" fill="${t.bg}"/>`, place(t.mark, 76.8, 76.8, 1.4)]),
  banner: (t) =>
    doc(1500, 500, "Slipway banner", () => [
      `<rect width="1500" height="500" fill="${t.bg}"/>`,
      place(t.mark, 150, 122, 1),
      sans(470, 250, 92, t.text, 10, "SLIPWAY"),
      mono(474, 308, 26, t.accent, 2, `${TAGLINE}  ${TAGLINE_2}`),
      mono(474, 388, 22, t.muted, 0.5, DESCRIPTOR),
    ]),
  "template-thumbnail": (t) => doc(1200, 750, "Slipway template thumbnail", () => pageMock(t, 1200, 750)),
};

/** PNG exports. `background: null` renders with a transparent background. */
export const PRESETS = ["dark", "light"].flatMap((theme) => [
  { name: `social-preview-${theme}`, template: "social-preview", theme, width: 1280, height: 640, background: THEMES[theme].bg },
  { name: `avatar-${theme}`, template: "avatar", theme, width: 512, height: 512, background: THEMES[theme].bg },
  { name: `banner-${theme}`, template: "banner", theme, width: 1500, height: 500, background: THEMES[theme].bg },
  { name: `template-thumbnail-${theme}`, template: "template-thumbnail", theme, width: 1200, height: 750, background: THEMES[theme].bg },
]);

export const TEMPLATE_FILES = PRESETS.map((p) => ({ file: `templates/${p.name}.svg`, svg: TEMPLATES[p.template](THEMES[p.theme]) }));

export const EXPORT_PRESETS_JSON = {
  version: tokens.version,
  format: "png",
  note: "Exports are rendered from the SVG sources with headless Chrome. Run `npm run export:brand`.",
  presets: PRESETS.map((p) => ({ name: p.name, source: `templates/${p.name}.svg`, output: `exports/${p.name}.png`, width: p.width, height: p.height, background: p.background })),
};
