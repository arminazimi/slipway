// Findings as GitHub Actions workflow commands (`::error file=...,line=...::message`), so they show as annotations
// on the pull request diff. Paths are relative to `cwd`, the repository root in a workflow.
import { join, relative, sep } from "node:path";
import { describe } from "./report.mjs";

// https://docs.github.com/actions/reference/workflow-commands-for-github-actions: data escapes % CR LF;
// property values also escape : and ,.
const escapeData = (text) => String(text).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escapeProperty = (text) => escapeData(text).replace(/:/g, "%3A").replace(/,/g, "%2C");

/** One workflow command per finding: `error` for a failed MUST, `warning` otherwise, titled with the test id. */
export function toAnnotations(report, folders, { cwd = process.cwd() } = {}) {
  return report.findings.map((finding) => {
    const properties = [];
    const base = finding.in === "output" ? folders.build : folders.source;
    if (finding.file && base) {
      properties.push(`file=${escapeProperty(relative(cwd, join(base, ...finding.file.split("/"))).split(sep).join("/"))}`);
      if (finding.line) properties.push(`line=${finding.line}`);
      if (finding.line && finding.column) properties.push(`col=${finding.column}`);
    }
    properties.push(`title=${escapeProperty(finding.id)}`);
    return `::${finding.severity === "error" ? "error" : "warning"} ${properties.join(",")}::${escapeData(describe(finding))}`;
  });
}
