// Space before punctuation, no space after it, and double spaces. This check reads prose only
// (prose.mjs drops code, front matter, HTML, URLs, and Liquid) and reports each problem at its
// file, line, and column with the corrected text. French sets a space before : ; ! ? on purpose,
// so a page in French is not judged on those marks.
import { prose } from "../prose.mjs";

export const id = "i18n.spacing";
export const level = "warning";

const BEFORE = /(\S)([ \t ]+)([,;:!?،؛؟]|\.(?!\.))(?=\s|$)/gu;
const AFTER = /([\p{L}])([,;!?،؛؟])(?=\p{L})/gu;
const DOUBLE = /(\S)( {2,})(?=\S)/gu;
const FRENCH_MARKS = new Set([";", ":", "!", "?"]);

/** The findings for one prose run; `column` is the run's 1-based column in the file. */
function scan(text, line, column, french, file, findings) {
  const found = [];
  for (const m of text.matchAll(BEFORE)) {
    if (french && FRENCH_MARKS.has(m[3])) continue;
    found.push({ index: m.index + m[1].length, length: m[2].length, replacement: "", why: `has a space before ${JSON.stringify(m[3])}` });
  }
  for (const m of text.matchAll(AFTER)) {
    found.push({ index: m.index + 2, length: 0, replacement: " ", why: `has no space after ${JSON.stringify(m[2])}` });
  }
  for (const m of text.matchAll(DOUBLE)) {
    found.push({ index: m.index + 1, length: m[2].length, replacement: " ", why: "has a double space" });
  }
  found.sort((a, b) => a.index - b.index);
  for (const { index, length, replacement, why } of found) {
    const suggested = text.slice(0, index) + replacement + text.slice(index + length);
    findings.push({ in: "source", file, line, column: column + index, message: `${why}; write ${JSON.stringify(suggested)}`, fix: suggested });
  }
}

export async function run(site) {
  const findings = [];
  for (const file of site.files()) {
    if (!/\.(md|markdown)$/i.test(file)) continue;
    const text = site.read(file);
    if (text === null) continue;
    const { lang, runs } = prose({ text });
    const french = /^fr(-|$)/i.test(lang ?? "");
    for (const r of runs) scan(r.text, r.line, r.column, french, file, findings);
  }
  return { status: findings.length ? "fail" : "pass", findings };
}
