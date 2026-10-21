// Checks every text and background pair in tokens/theme.tokens.json for WCAG 2.x AA, in light and dark.
// APCA (Lc) is printed for information and never fails the run.
//   node tools/theme/contrast.mjs
import { fileURLToPath } from "node:url";
import { loadTokens, resolveToken } from "./tokens.mjs";

const required = { text: 4.5, large: 3, ui: 3 };

function channels(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`expected a #rrggbb color, got "${hex}"`);
  return [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255);
}

function luminance(hex, exponent, weights) {
  return channels(hex).reduce((sum, c, i) => sum + weights[i] * (exponent === "wcag" ? (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) : c ** 2.4), 0);
}

/** WCAG 2.x contrast ratio, from 1 to 21. */
export function contrastRatio(fg, bg) {
  const weights = [0.2126, 0.7152, 0.0722];
  const [high, low] = [luminance(fg, "wcag", weights), luminance(bg, "wcag", weights)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

/** APCA lightness contrast (Lc, 0.98G-4g); positive for dark text on a light background. */
export function apca(fg, bg) {
  const weights = [0.2126729, 0.7151522, 0.072175];
  const soft = (y) => (y < 0.022 ? y + (0.022 - y) ** 1.414 : y);
  const text = soft(luminance(fg, "apca", weights));
  const back = soft(luminance(bg, "apca", weights));
  if (back >= text) {
    const s = (back ** 0.56 - text ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (back ** 0.65 - text ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

/** Every declared pair in both modes, with its ratio, APCA value, and whether it meets its requirement. */
export function checkPairs(tokens) {
  const pairs = tokens.$extensions?.slipway?.pairs ?? [];
  return pairs.flatMap(([fg, bg, kind]) =>
    ["light", "dark"].map((mode) => {
      const front = resolveToken(tokens, fg, mode);
      const back = resolveToken(tokens, bg, mode);
      const ratio = contrastRatio(front, back);
      return { pair: `${fg} on ${bg}`, kind, mode, ratio, apca: apca(front, back), required: required[kind], ok: ratio >= required[kind] };
    }),
  );
}

export function main() {
  const results = checkPairs(loadTokens());
  for (const r of results) {
    console.log(`${r.ok ? "ok  " : "FAIL"} ${r.mode.padEnd(5)} ${r.pair.padEnd(40)} ${r.ratio.toFixed(2)}:1 (needs ${r.required})  Lc ${Math.abs(r.apca).toFixed(0)}`);
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`FAIL: ${failed.length} text pair(s) are below WCAG AA`);
    process.exitCode = 1;
  } else console.log(`OK: contrast (${results.length} pairs pass WCAG AA)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
