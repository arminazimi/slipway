// Root-relative Markdown links break when a site is served under a base path. The engine names that
// path `base` (ADR 0024); the check reads it from the engine config.
export const id = "doctor.root-links";
export const level = "warning";

import { detect } from "../detect.ts";
import { blocks } from "../markdown.ts";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

/** The site's base path and the config key that names it, for the generator at hand. */
function baseOf(site) {
  if (detect(site.source).generator === "mizzen") {
    const base = site.config()?.data?.base;
    return { base: typeof base === "string" ? base : "", key: "base" };
  }
  return { base: "", key: "base" };
}

export async function run(site) {
  const { base, key } = baseOf(site);
  if (!base) {
    return result([]);
  }

  const findings = [];

  // An engine site that has a manifest names its pages there; without one, read every Markdown source.
  const listed = site.sources();
  const files = listed.length
    ? listed.filter((file) => /\.(md|markdown)$/i.test(file))
    : site.files().filter((file) => /\.(md|markdown)$/i.test(file));

  for (const file of files) {
    const content = site.read(file);

    // Skip code blocks: `blocks` returns the prose lines only. Inline code spans are excluded below.
    for (const { line, text } of blocks(content).prose) {
      // Find Markdown links [text](/root-relative/path)
      const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(text)) !== null) {
        const url = match[2];
        if (!url.startsWith("/") || url.startsWith("//")) continue;

        // A link inside an inline code span is an example, not a link.
        const before = text.slice(0, match.index);
        if ((before.match(/`/g) ?? []).length % 2 !== 0) continue;

        const alternative = key === "base" ? "Use a relative link." : "Use a relative link or `relative_url`.";
        findings.push({
          in: "source",
          file,
          line,
          message: `Root-relative link \`${url}\` will break when \`${key}\` is set. ${alternative}`,
        });
      }
    }
  }

  return result(findings);
}
