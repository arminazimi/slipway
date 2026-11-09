// The Action's job summary (GitHub-flavored Markdown for $GITHUB_STEP_SUMMARY) and its shields.io endpoint badge.
// Both read the report only and never change the level or the exit code.
import { relative, resolve, sep } from "node:path";

const colors = { L3: "green", L2: "yellow", L1: "orange" };
const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const cell = (text) => String(text).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");

function location(finding, folders) {
  if (!finding.file) return finding.message;
  const base = finding.in === "output" ? folders?.build : folders?.source;
  const path = base ? relative(process.cwd(), resolve(base, finding.file)).split(sep).join("/") : finding.file;
  const shown = path.startsWith("..") ? finding.file : path;
  return finding.line ? `${shown}:${finding.line}` : shown;
}

/** The report as a Markdown job summary: the level, the counts by severity, the findings table, and tests not run. */
export function summaryMarkdown(report, folders) {
  const findings = report.findings ?? [];
  const errors = findings.filter((finding) => finding.severity === "error").length;
  const warnings = findings.length - errors;
  const level = report.level ?? "L0";
  const reached = report.level ? "" : " (not reached)";
  const lines = [
    "## slipway doctor",
    "",
    `**Level: ${level}**${reached} (agent-editable ${report.version}) — ${plural(errors, "error")}, ${plural(warnings, "warning")}`,
    "",
  ];
  if (findings.length === 0) {
    lines.push("No findings.");
  } else {
    lines.push("| Test | Location | Message |", "| --- | --- | --- |");
    for (const finding of findings) lines.push(`| ${cell(finding.id)} | ${cell(location(finding, folders))} | ${cell(finding.message)} |`);
  }
  if (report.notRun?.length) lines.push("", `Not run: ${report.notRun.join(", ")}.`);
  return lines.join("\n");
}

/** The report as a shields.io endpoint badge: L3 green, L2 yellow, L1 orange, and L0 or no level red. */
export function badgeJson(report) {
  const level = report.level;
  return { schemaVersion: 1, label: "slipway doctor", message: level ?? "L0", color: colors[level] ?? "red" };
}
