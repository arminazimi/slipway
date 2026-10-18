import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import { badgeSvg } from "./badge.mjs";
import { generatedFiles } from "./build.mjs";
import { readIco } from "./ico.mjs";
import { BRAND_DIR, FAVICON, MARK, VARIANTS, faviconSvg, markSvg, tokens } from "./mark.mjs";
import { FAVICON_ICO, FAVICON_PNGS } from "./outputs.mjs";
import { EXPORT_PRESETS_JSON, PRESETS, TEMPLATES, THEMES } from "./templates.mjs";

const hex = (name) => tokens.colors[name].value;

function luminance(h) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg, bg) {
  const [hi, lo] = [luminance(hex(fg)), luminance(hex(bg))].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

test("every pair the guide approves for text meets 4.5:1", () => {
  const approved = [["text", "canvas"], ["text", "surface"], ["light", "canvas"], ["tint", "canvas"], ["bronze", "canvas"], ["bronze", "surface"], ["mist", "canvas"], ["mist", "surface"], ["canvas", "light"], ["inkBronze", "light"], ["canvas", "bronze"]];
  for (const [fg, bg] of approved) assert.ok(contrast(fg, bg) >= 4.5, `${fg} on ${bg} is ${contrast(fg, bg).toFixed(2)}:1`);
});

test("the pairs the guide forbids for text really fall short", () => {
  assert.ok(contrast("bronzeSoft", "light") < 4.5 && contrast("bronzeSoft", "light") >= 3, "bronze soft on light is for graphics only");
  assert.ok(contrast("bronze", "light") < 3, "bronze on light");
  assert.ok(contrast("inkBronze", "canvas") < 3, "ink bronze on canvas");
});

test("the guide's contrast table matches the tokens", () => {
  const guide = readFileSync(join(BRAND_DIR, "BRAND_GUIDE.md"), "utf8");
  const names = { Canvas: "canvas", Surface: "surface", Bronze: "bronze", "Bronze Soft": "bronzeSoft", "Ink Bronze": "inkBronze", Tint: "tint", Light: "light", Text: "text", Mist: "mist" };
  const rows = [...guide.matchAll(/^\| ([A-Za-z ]+) \| ([A-Za-z ]+) \| (\d+\.\d+):1 \|/gm)];
  assert.ok(rows.length >= 11, "contrast table not found");
  for (const [, fg, bg, ratio] of rows) {
    assert.ok(names[fg] && names[bg], `unknown color in table: ${fg} / ${bg}`);
    assert.equal(contrast(names[fg], names[bg]).toFixed(2), ratio, `${fg} on ${bg}`);
  }
});

test("the guide's color table lists every token with its value", () => {
  const guide = readFileSync(join(BRAND_DIR, "BRAND_GUIDE.md"), "utf8");
  for (const [name, { value }] of Object.entries(tokens.colors)) assert.ok(guide.includes(value), `${name} ${value} is missing from the guide`);
});

test("generation is deterministic and every SVG is a standalone document", () => {
  const a = generatedFiles();
  const b = generatedFiles();
  assert.deepEqual([...a], [...b]);
  for (const [path, content] of a) if (path.endsWith(".svg")) assert.match(content, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, path);
});

test("every color in a generated SVG is a palette color", () => {
  const palette = new Set(Object.values(tokens.colors).map((c) => c.value.toLowerCase()));
  palette.add("#0c0906"); // the sheet's outer backdrop
  palette.add("#4a4036"); // swatch outline on the sheet
  palette.add("#fff");
  palette.add("#ffffff"); // the page panel in the light template thumbnail
  for (const [path, content] of generatedFiles()) {
    if (!path.endsWith(".svg")) continue;
    for (const [color] of content.matchAll(/#[0-9a-fA-F]{6}\b|#fff\b/g)) assert.ok(palette.has(color.toLowerCase()), `${path} uses ${color}`);
  }
});

test("the four colorways share one geometry; the one-color ones use a single color", () => {
  const shape = (svg) => svg.replace(/stroke="#[0-9a-fA-F]{6}"/g, "stroke=X").replace(/<title[^>]*>.*?<\/title>/, "");
  const shapes = new Set(Object.keys(VARIANTS).map((v) => shape(markSvg(v))));
  assert.equal(shapes.size, 1);
  for (const v of ["mono", "mono-light"]) assert.equal(new Set(markSvg(v).match(/stroke="#[0-9a-fA-F]{6}"/g)).size, 1, v);
  for (const v of ["dark", "light"]) assert.equal(new Set(markSvg(v).match(/stroke="#[0-9a-fA-F]{6}"/g)).size, 2, v);
});

test("the mark keeps the geometry decided in ADR 0005", () => {
  assert.deepEqual(MARK, { radii: [88, 58], width: 16, angle: 35, halfGap: 9 });
  const svg = markSvg("dark");
  assert.ok(svg.includes('r="88"') && svg.includes('r="58"'));
  assert.ok(svg.includes(`stroke="${hex("light")}"`) && svg.includes(`stroke="${hex("bronze")}"`));
});

test("the favicon mark keeps every stroke and the gap at least 2 px wide at 16 px", () => {
  const scale = 16 / 256;
  assert.ok(FAVICON.width * scale >= 2, "ring stroke");
  assert.ok(2 * FAVICON.halfGap * scale >= 2, "gap");
  for (const rounded of [true, false]) assert.equal(faviconSvg({ rounded }).includes('rx="'), rounded);
});

test("the favicon exports exist at the sizes they claim, and the .ico holds 16, 32, and 48 px PNGs", () => {
  const dimensions = (file) => {
    const png = readFileSync(join(BRAND_DIR, file));
    assert.equal(png.toString("latin1", 1, 4), "PNG", file);
    return [png.readUInt32BE(16), png.readUInt32BE(20)];
  };
  for (const { output, size } of FAVICON_PNGS) assert.deepEqual(dimensions(output), [size, size], output);
  const images = readIco(readFileSync(join(BRAND_DIR, FAVICON_ICO.output)));
  assert.deepEqual(images.map((i) => i.width), FAVICON_ICO.sizes);
  assert.ok(images.every((i) => i.png && i.width === i.height));
});

test("the full-bleed icons are opaque, so a system can mask them without black corners", () => {
  for (const file of ["favicon/apple-touch-icon.png", "favicon/icon-192.png", "favicon/icon-512.png"]) {
    assert.equal(readFileSync(join(BRAND_DIR, file)).readUInt8(25), 2, `${file} should be RGB without an alpha channel`);
  }
});

test("the badge carries words, not only a color, and its text is readable", () => {
  const svg = badgeSvg();
  assert.match(svg, />built with</);
  assert.match(svg, />slipway</);
  assert.match(svg, /aria-label="built with slipway"/);
  assert.ok(contrast("light", "surface") >= 4.5 && contrast("canvas", "bronze") >= 4.5);
});

test("tokens.css has every token and the two themes", () => {
  const css = readFileSync(join(BRAND_DIR, "tokens.css"), "utf8");
  for (const { value } of Object.values(tokens.colors)) assert.ok(css.includes(value.toLowerCase()), value);
  assert.ok(css.includes('[data-slipway-theme="dark"]') && css.includes('[data-slipway-theme="light"]'));
});

test("every social template exists in a dark and a light version at the size the presets claim", () => {
  const sizes = { "social-preview": [1280, 640], avatar: [512, 512], banner: [1500, 500], "template-thumbnail": [1200, 750] };
  assert.equal(PRESETS.length, Object.keys(sizes).length * 2);
  for (const p of PRESETS) {
    assert.deepEqual([p.width, p.height], sizes[p.template], p.name);
    const svg = TEMPLATES[p.template](THEMES[p.theme]);
    assert.ok(svg.includes(`width="${p.width}" height="${p.height}"`), `${p.name} svg size`);
    assert.equal(p.background, THEMES[p.theme].bg, `${p.name} background`);
  }
});

test("the social exports are PNGs of the right size", () => {
  for (const p of EXPORT_PRESETS_JSON.presets) {
    const png = readFileSync(join(BRAND_DIR, p.output));
    assert.equal(png.toString("latin1", 1, 4), "PNG", p.output);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [p.width, p.height], p.output);
  }
});

test("the social art uses the brand's words and no others", () => {
  const all = PRESETS.map((p) => TEMPLATES[p.template](THEMES[p.theme])).join("\n");
  assert.match(all, /SLIPWAY/);
  assert.match(all, new RegExp(tokens.tagline.toUpperCase().replace(/\./g, "\\.")));
  assert.match(all, new RegExp(tokens.descriptor.replace(/\./g, "\\.")));
  assert.ok(!/seaworthy\.sh|npx |AI-powered/i.test(all), "no invented domains, commands, or hype words");
});
