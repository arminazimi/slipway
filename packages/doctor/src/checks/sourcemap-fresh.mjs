// A committed source map (spec/sourcemap/v0.md, level 1) can go stale when a page is edited above a
// heading: the recorded line then points at the wrong place in the source. Compare each section's
// recorded line with the heading's current line in the Markdown source.
export const id = "doctor.sourcemap-fresh";
export const level = "warning";

import { headings } from "../markdown.mjs";
import { alnum, failWith, inOrder } from "../utils.mjs";

const isMarkdown = (file) => /\.(md|markdown|mkdown|mkdn|mkd)$/i.test(file);

/** The headings whose text holds the section's plain text, in document order. */
function holding(found, text) {
  const wanted = alnum(text);
  if (!wanted.length) return [];
  return found.filter((heading) => inOrder(wanted, alnum(heading.text)));
}

export function run(site) {
  if (!site.isFile(site.source, "sourcemap.json")) return { status: "pass", findings: [] };
  let map;
  try {
    map = JSON.parse(site.read("sourcemap.json"));
  } catch {
    // A level 0 page with front matter, which the build turns into the map: nothing to compare yet.
    return { status: "pass", findings: [] };
  }

  const findings = [];
  const pages = Array.isArray(map?.pages) ? map.pages : [];
  for (const page of pages) {
    if (typeof page?.source !== "string" || !isMarkdown(page.source) || !site.isFile(site.source, page.source)) continue;
    if (!Array.isArray(page.sections)) continue;
    const found = headings(site.read(page.source));
    for (const section of page.sections) {
      if (typeof section?.text !== "string" || !Number.isInteger(section.line) || section.line < 1) continue;
      const here = found.find((heading) => heading.line === section.line);
      if (here && inOrder(alnum(section.text), alnum(here.text))) continue;
      const moved = holding(found, section.text)[0];
      const fix = "regenerate sourcemap.json (Slipway: `npm run sourcemap`) and commit it";
      if (moved) {
        findings.push({
          in: "source",
          file: page.source,
          line: moved.line,
          message: `heading ${JSON.stringify(section.text)} is at line ${moved.line}, but sourcemap.json records line ${section.line}`,
          fix,
        });
      } else {
        findings.push({
          in: "source",
          file: page.source,
          line: section.line,
          message: `sourcemap.json records heading ${JSON.stringify(section.text)} at line ${section.line}, but the source has no such heading`,
          fix,
        });
      }
    }
  }
  return failWith(findings);
}
