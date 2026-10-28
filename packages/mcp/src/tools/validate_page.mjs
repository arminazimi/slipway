import { sep } from "node:path";
import { Site } from "../../../doctor/src/site.mjs";
import { schemaProblems } from "../../../doctor/src/utils.mjs";
import { insideSite } from "../tools.mjs";

export const definition = {
  name: "validate_page",
  description: "Validate one page's front matter against its layout's schema and return each error with key, allowed values, and line, without running the full doctor. It reads and writes only inside the site directory the server was given, and its output is JSON with file paths and lines where they apply.",
  inputSchema: {
    type: "object",
    properties: {
      file: { type: "string", description: "The page file to validate, relative to the site directory." },
    },
    required: ["file"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

export async function validatePage(siteDir, { file }) {
  if (typeof file !== "string") throw new Error("file must be a string");

  insideSite(siteDir, file);

  const site = new Site(siteDir);
  const relFile = file.split(sep).join('/');

  const index = site.index();
  if (index?.errors) {
     return { errors: index.errors.map(e => ({ file: "content-schemas.json", key: e.key, message: e.message })) };
  }

  if (!index?.data) throw new Error("no valid content-schemas.json found");

  const schemas = await site.schemas();
  const errors = [];

  for (const entry of index.data.schemas) {
    if (!site.applies(entry, relFile)) continue;

    const compiled = schemas.get(entry.schema);
    if (compiled?.error) {
       errors.push({ file: relFile, key: "/", message: `Schema error: ${compiled.error}` });
       continue;
    }
    if (compiled?.notRun) {
       errors.push({ file: relFile, key: "/", message: `Schema not run: ${compiled.notRun}` });
       continue;
    }
    if (!compiled?.validate) continue;

    const parsed = entry.target === "file" ? site.dataOf(relFile) : site.frontMatterOf(relFile);
    if (!parsed) continue;

    if (parsed.unsupported) {
       errors.push({ file: relFile, key: "/", message: `Unsupported: ${parsed.unsupported}` });
    } else if (parsed.error) {
       errors.push({ file: relFile, line: parsed.line, key: "/", message: parsed.error });
    } else if (parsed.data) {
       for (const problem of schemaProblems(compiled.validate, parsed.data, parsed.lineOf, parsed.offset)) {
         const { key, line, message, allowed } = problem;
         errors.push({ file: relFile, line, key, message, allowed });
       }
    }
  }

  return { errors };
}

export const handler = (site, args) => validatePage(site, args);
