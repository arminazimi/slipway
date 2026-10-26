// The doctor Action's step: runs slipway doctor once, prints the report and one annotation per finding, and writes
// SARIF when asked. Inputs arrive as SLIPWAY_* variables from action.yml.
import { appendFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { doctor, levels } from "../../packages/doctor/src/doctor.mjs";
import { exitCode, formatText } from "../../packages/doctor/src/cli.mjs";
import { toSarif } from "../../packages/doctor/src/report.mjs";
import { toAnnotations } from "../../packages/doctor/src/github.mjs";

const input = (name) => (process.env[`SLIPWAY_${name}`] ?? "").trim();
const fail = (message) => {
  console.log(`::error title=slipway doctor::${message}`);
  process.exit(2);
};

const level = input("LEVEL") || "L1";
const format = input("FORMAT") || "text";
const sarif = input("SARIF") === "true";
const sarifFile = input("SARIF_FILE") || "slipway.sarif";
if (level !== "none" && !levels.includes(level)) fail(`level must be one of ${levels.join(", ")}, or none, not ${level}`);
if (!["text", "json"].includes(format)) fail(`format must be text or json, not ${format}`);

const folders = { source: resolve(input("PATH") || "."), build: input("BUILD") ? resolve(input("BUILD")) : null };
let report;
try {
  report = await doctor(folders.source, { build: folders.build });
} catch (caught) {
  fail(caught.message);
}

console.log(format === "json" ? JSON.stringify(report, null, 2) : formatText(report, folders));
for (const line of toAnnotations(report, folders)) console.log(line);
if (sarif) writeFileSync(sarifFile, `${JSON.stringify(toSarif(report, folders), null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `level=${report.level ?? "none"}\nsarif-file=${sarif ? sarifFile : ""}\n`);
}
process.exitCode = level === "none" ? 0 : exitCode(report, level);
