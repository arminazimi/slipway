export const id = "docs.description";
export const level = "warning";

const notContent = /^(_layouts|_includes|_sass|_data|_site|_drafts|vendor|node_modules)\//;
const isMarkdown = (path) => /\.(md|markdown)$/i.test(path);
const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

/** The docs quality checks only apply where the site has a docs navigation. */
export function docsNavigation(site) {
  for (const name of ["_data/navigation.yml", "_data/navigation.yaml"]) {
    if (!site.isFile(site.source, name)) continue;
    const { data } = site.dataOf(name);
    if (data && data.docs) return data.docs;
  }
  return null;
}

export async function run(site) {
  if (!docsNavigation(site)) return result([]);
  const findings = [];
  for (const path of site.files()) {
    if (notContent.test(path) || !isMarkdown(path)) continue;
    const fm = site.frontMatterOf(path);
    if (!fm?.data || fm.data.layout === "none") continue;
    const description = fm.data.description;
    if (typeof description === "string" && description.trim()) continue;
    findings.push({
      in: "source",
      file: path,
      line: (fm.lineOf(["title"]) || 0) + fm.offset,
      message: "has no description for search results and link previews",
      fix: "add `description:` to the front matter",
    });
  }
  return result(findings);
}
