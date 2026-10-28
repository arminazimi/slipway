import { realpathSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { doctor } from "../../../doctor/src/doctor.mjs";
import { outside } from "../tools.mjs";

export const definition = {
  name: "findings_for_file",
  description: "Run slipway doctor and return only the findings that point at one source file. Reads only inside the site directory.",
  inputSchema: {
    type: "object",
    properties: {
      file: { type: "string", description: "The file to get findings for, relative to the site directory." },
    },
    required: ["file"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

/** Run doctor and filter findings for `file`. */
export async function runFindingsForFile(site, { file }) {
  if (typeof file !== "string") throw new Error("file must be a string");
  const siteReal = realpathSync(site);
  const target = resolve(siteReal, file);
  if (outside(siteReal, target)) throw new Error(`${file} is outside the site directory`);

  // Normalize the relative path to compare with finding.file
  let relFile = relative(siteReal, target);
  // Ensure the relative path always uses forward slashes to match doctor's reporting
  relFile = relFile.split(sep).join('/');

  const report = await doctor(siteReal, { build: null });
  const findings = report.findings.filter((finding) => finding.file === relFile);

  return { findings };
}

export const handler = (site, args) => runFindingsForFile(site, args);
