export const id = "doctor.twin-fresh";
export const level = "warning";

import { createHash } from "node:crypto";
import { detect } from "../detect.ts";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

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

/**
 * An engine site's twins, from the build manifest: every page that lists a Markdown twin in `outputs` must have it in
 * the output folder, and the twin must carry the page's current body. Freshness compares the current source's hash
 * with `hashes.source` in the manifest, then the twin's own hash with the same value, so an edit after a build and an
 * edited twin are both reported. `null` when there is no manifest to read.
 */
function engineFindings(site) {
  if (!site.build) return null;
  const pages = site.pages();
  if (!pages.length) return null;

  const findings = [];
  for (const page of pages) {
    if (typeof page?.source !== "string") continue;
    const twins = (Array.isArray(page.outputs) ? page.outputs : []).filter((output) => typeof output === "string" && output.endsWith(".md"));
    if (!twins.length) continue;
    const expected = page.hashes?.source;

    if (!site.isFile(site.source, page.source)) {
      findings.push({
        in: "source",
        file: page.source,
        line: 1,
        message: `is listed in the build manifest but no longer exists, so its Markdown twin is orphaned`,
        fix: `run \`slipway build\``,
      });
      continue;
    }

    if (typeof expected === "string" && hashOf(bodyOf(site.read(page.source))) !== expected) {
      findings.push({
        in: "source",
        file: page.source,
        line: 1,
        message: `changed after the build: its Markdown twin \`${twins[0]}\` is stale`,
        fix: `run \`slipway build\``,
      });
      continue;
    }

    for (const twin of twins) {
      if (!site.isFile(site.build, twin)) {
        findings.push({
          in: "source",
          file: page.source,
          line: 1,
          message: `is missing its Markdown twin \`${twin}\``,
          fix: `run \`slipway build\``,
        });
        continue;
      }
      if (typeof expected === "string" && hashOf(site.readOutput(twin)) !== expected) {
        findings.push({
          in: "source",
          file: page.source,
          line: 1,
          message: `has a Markdown twin \`${twin}\` that does not match the source hash in \`.slipway/manifest.json\``,
          fix: `run \`slipway build\``,
        });
      }
    }
  }
  return findings;
}

export async function run(site) {
  const { generator } = detect(site.source);
  if (generator === "mizzen") {
    const findings = engineFindings(site);
    return result(findings ?? []);
  }
  return result([]);
}
