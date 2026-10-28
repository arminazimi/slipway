export const id = "doctor.schema-coverage";
export const level = "warning";

export async function run(site) {
  const findings = [];
  const schemas = await site.schemas();
  const index = site.index();

  if (!index || !index.data || !index.data.schemas) {
    return { status: "pass", findings };
  }

  const layoutSchemas = new Set();
  const collectionSchemas = new Set();

  for (const entry of index.data.schemas) {
    if (entry.target === "front-matter") {
      const match = entry.schema.match(/schema\/front-matter\/([^.]+)\.schema\.json/);
      if (match) {
         if (entry.when && entry.when.layout) layoutSchemas.add(entry.when.layout);
         else layoutSchemas.add(match[1]);
      }
    }
  }

  // Iterate over files
  for (const file of site.files()) {
    if (file.endsWith(".md") || file.endsWith(".html")) {
      const fm = site.frontMatterOf(file);
      if (fm && fm.data) {
        if (fm.data.layout && !layoutSchemas.has(fm.data.layout)) {
          findings.push({
             in: "source",
             file,
             line: fm.lineOf(["layout"]) || 1,
             message: `uses layout '${fm.data.layout}' but no schema covers it`,
             fix: `create schema/front-matter/${fm.data.layout}.schema.json and add it to content-schemas.json`
          });
        }
      }
    }
  }

  return { status: findings.length ? "fail" : "pass", findings };
}
