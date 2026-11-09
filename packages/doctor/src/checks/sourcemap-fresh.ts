// A committed source map (spec/sourcemap/v0.md, level 1) can go stale when a page is edited above a
// heading: the recorded line then points at the wrong place in the source. Compare each section's
// recorded line with the heading's current line in the Markdown source. On an engine site the map is an
// output (`sourcemap.json` in the build folder), and freshness also compares each page's source hash with
// the one the build manifest recorded.
export const id = "doctor.sourcemap-fresh";
export const level = "warning";

import { createHash } from "node:crypto";
import { detect } from "../detect.ts";
import { headings } from "../markdown.ts";
import { alnum, failWith, inOrder } from "../utils.ts";

const isMarkdown = (file) => /\.(md|markdown|mkdown|mkdn|mkd)$/i.test(file);

const FENCE = /^---[ \t]*$/;

/** SHA-256 of the text as 64 lowercase hex characters, the form the engine's manifest records. */
function hashOf(text) {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * A source file's body after its front matter, split the way the engine's `parseFrontMatter` does, so hashing it
 * gives the manifest's `hashes.source`. Front matter is not part of that hash, and the body keeps its line endings.
 */
function bodyOf(source) {
  const text = source.startsWith("\uFEFF") ? source.slice(1) : source;
  const lines = text.split(/(?<=\n)/);
  const strip = (line) => line.replace(/\r?\n$/, "");
  if (!lines.length || !FENCE.test(strip(lines[0]))) return text;
  const close = lines.findIndex((line, index) => index > 0 && FENCE.test(strip(line)));
  return close === -1 ? text : lines.slice(close + 1).join("");
}

/** The headings whose text holds the section's plain text, in document order. */
function holding(found, text) {
  const wanted = alnum(text);
  if (!wanted.length) return [];
  return found.filter((heading) => inOrder(wanted, alnum(heading.text)));
}

/** A map page's sections against the source, shared by the source-folder map and the engine's output map. */
function compare(site, pages, fix) {
  const findings = [];
  for (const page of pages) {
    if (typeof page?.source !== "string" || !isMarkdown(page.source) || !site.isFile(site.source, page.source)) continue;
    if (!Array.isArray(page.sections)) continue;
    const found = headings(site.read(page.source));
    for (const section of page.sections) {
      if (typeof section?.text !== "string" || !Number.isInteger(section.line) || section.line < 1) continue;
      const here = found.find((heading) => heading.line === section.line);
      if (here && inOrder(alnum(section.text), alnum(here.text))) continue;
      const moved = holding(found, section.text)[0];
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
  return findings;
}

/**
 * An engine site's map, read from the output folder. A page edited after the build is reported once, on line 1,
 * unless a heading already moved and `compare` named the exact line: the manifest's `hashes.source` is the hash of
 * the source body the build read, so a different hash means the output map no longer covers the current source.
 */
function engineFindings(site) {
  const map = site.sourcemap()?.data;
  if (!map) return [];
  const findings = compare(site, Array.isArray(map.pages) ? map.pages : [], "run `slipway build`");
  const named = new Set(findings.map((finding) => finding.file));
  for (const page of site.pages()) {
    if (typeof page?.source !== "string" || !isMarkdown(page.source) || !site.isFile(site.source, page.source)) continue;
    const expected = page.hashes?.source;
    if (typeof expected !== "string" || named.has(page.source)) continue;
    if (hashOf(bodyOf(site.read(page.source))) === expected) continue;
    findings.push({
      in: "source",
      file: page.source,
      line: 1,
      message: `changed after the build, so sourcemap.json no longer matches it`,
      fix: "run `slipway build`",
    });
  }
  return findings;
}

export function run(site) {
  if (detect(site.source).generator === "mizzen") return failWith(engineFindings(site));

  if (!site.isFile(site.source, "sourcemap.json")) return { status: "pass", findings: [] };
  let map;
  try {
    map = JSON.parse(site.read("sourcemap.json"));
  } catch {
    // A level 0 page with front matter, which the build turns into the map: nothing to compare yet.
    return { status: "pass", findings: [] };
  }

  return failWith(compare(site, Array.isArray(map?.pages) ? map.pages : [], "regenerate sourcemap.json (Slipway: `npm run sourcemap`) and commit it"));
}
