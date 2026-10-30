export const id = "i18n.kashida";
export const level = "warning";

import { blocks } from "../markdown.mjs";

const KASHIDA = /\u0640+/g;
const REPEATED = /(\p{Script=Arabic})\1{2,}/gu;
const CODE_SPAN = /(`+)(?!`)(.+?)(?<!`)\1(?!`)/g;

const frontMatterLines = (source) => {
  const match = /^---\r?\n[\s\S]*?\r?\n?---\r?\n?/.exec(source) || /^\+\+\+\r?\n[\s\S]*?\r?\n?\+\+\+\r?\n?/.exec(source);
  return match ? (match[0].match(/\n/g) ?? []).length : 0;
};

const codeSpans = (text) => [...text.matchAll(CODE_SPAN)].map((match) => [match.index, match.index + match[0].length]);

const inCodeSpan = (spans, index) => spans.some(([start, end]) => index >= start && index < end);

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

export async function run(site) {
  const findings = [];

  for (const file of site.files()) {
    if (!/\.(md|markdown)$/i.test(file)) continue;
    const content = site.read(file);
    if (content === null) continue;

    const body = frontMatterLines(content);
    for (const { line, text } of blocks(content).prose) {
      if (line <= body) continue;
      const spans = codeSpans(text);
      const add = (index, length, replacement, why) => {
        if (inCodeSpan(spans, index)) return;
        const suggested = (text.slice(0, index) + replacement + text.slice(index + length)).trim();
        findings.push({
          in: "source",
          file,
          line,
          column: index + 1,
          message: `${why}; write ${JSON.stringify(suggested)}`,
          fix: suggested,
        });
      };

      for (const match of text.matchAll(KASHIDA)) add(match.index, match[0].length, "", "uses kashida (ـ) to stretch a letter");
      for (const match of text.matchAll(REPEATED)) add(match.index, match[0].length, match[1], `repeats ${JSON.stringify(match[1])} to stretch a letter`);
    }
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
  return result(findings);
}
