export const id = "doctor.twin-fresh";
export const level = "warning";

import { detect } from "../detect.mjs";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

const LISTING_LAYOUTS = ["home", "archive", "tags", "author", "not-found"];

function isMarkdown(file) {
  return /\.(md|markdown|mkdown|mkdn|mkd)$/i.test(file);
}

function getExpectedStubPath(source) {
  const parts = source.split("/");
  const hidden = parts.findIndex(part => part.startsWith("_"));

  if (hidden === -1) {
    return source.replace(/\.[^./]+$/, ".twin.html");
  }

  const name = parts.slice(hidden).join("-").replace(/^_/, "").replace(/\.[^./]+$/, ".twin.html");
  return [...parts.slice(0, hidden), name].join("/");
}

export async function run(site) {
  const { generator } = detect(site.source);
  if (generator !== "jekyll") return result([]);

  const findings = [];

  const mdFiles = site.files().filter(f => isMarkdown(f) && !f.startsWith("_site/") && !f.startsWith("node_modules/"));
  const twinFiles = site.files().filter(f => f.endsWith(".twin.html") && !f.startsWith("_site/") && !f.startsWith("node_modules/"));

  const expectedTwins = new Map(); // path -> source

  for (const md of mdFiles) {
    const fm = site.frontMatterOf(md);
    if (!fm) continue;

    if (fm.data && LISTING_LAYOUTS.includes(fm.data.layout)) continue;

    const stubPath = getExpectedStubPath(md);
    expectedTwins.set(stubPath, md);
  }

  for (const twin of twinFiles) {
    const fm = site.frontMatterOf(twin);
    if (!fm || !fm.data || !fm.data.twin_of) continue;

    const twinOf = fm.data.twin_of;

    if (!expectedTwins.has(twin) || expectedTwins.get(twin) !== twinOf) {
       findings.push({
         in: "source",
         file: twin,
         line: fm.lineOf(["twin_of"]) + fm.offset,
         message: `twin is orphaned or stale: source page \`${twinOf}\` does not exist or moved`,
         fix: `delete this file and run \`npm run twins\``,
       });
    } else {
       expectedTwins.delete(twin);
    }
  }

  for (const [stubPath, source] of expectedTwins) {
    findings.push({
      in: "source",
      file: source,
      line: 1,
      message: `is missing its Markdown twin stub \`${stubPath}\``,
      fix: `run \`npm run twins\``
    });
  }

  return result(findings);
}
