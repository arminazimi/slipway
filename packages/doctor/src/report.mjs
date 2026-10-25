// The doctor's report formats: JSON (spec/agent-editable/report.schema.json) for agents, and SARIF 2.1.0 for
// GitHub code scanning. Findings on built pages are moved to the source file and line through sourcemap.json.
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
export const tool = { name: "slipway doctor", version: pkg.version, informationUri: "https://github.com/arminazimi/slipway/tree/main/packages/doctor" };

/**
 * A finding on a built HTML page, moved to the source file the source map gives for that page: at the line of the
 * section named by `key`, or with no line when the finding had none. A finding with a line in the built page and no
 * matching section keeps it, since that line is more precise. The built file is kept in `output`.
 */
export function locate(site, finding) {
  if (finding.in !== "output" || !finding.file || !/\.html?$/i.test(finding.file)) return finding;
  const pages = site.sourcemap()?.data?.pages;
  if (!Array.isArray(pages)) return finding;
  const page = pages.find((p) => typeof p?.url === "string" && typeof p.source === "string" && site.outputFile(p.url) === finding.file);
  if (!page || !site.isFile(site.source, page.source)) return finding;
  const section = Array.isArray(page.sections) && finding.key !== undefined ? page.sections.find((s) => s?.id === finding.key) : null;
  const sectionLine = Number.isInteger(section?.line) && section.line >= 1 ? section.line : null;
  if (!sectionLine && finding.line) return finding;
  const { in: _, file, line: __, column: ___, ...rest } = finding;
  const moved = { ...rest, in: "source", file: page.source, output: { file } };
  if (sectionLine) moved.line = sectionLine;
  return moved;
}

/** A finding's text without its location: `key: message (allowed: ...) (fix: ...)`. */
export function describe(finding) {
  const key = finding.key ? `${finding.key}: ` : "";
  const allowed = finding.allowed?.length ? ` (allowed: ${finding.allowed.join(", ")})` : "";
  const fix = finding.fix ? ` (fix: ${finding.fix})` : "";
  return `${key}${finding.message}${allowed}${fix}`;
}

/** A file in the source or output folder as a SARIF URI: relative to `cwd` with forward slashes, or a file: URL outside it. */
function artifactUri(base, file, cwd) {
  const full = join(base, ...file.split("/"));
  const rel = relative(cwd, full);
  if (rel.startsWith("..") || isAbsolute(rel)) return pathToFileURL(full).href;
  return rel.split(sep).map(encodeURIComponent).join("/");
}

/**
 * The report as a SARIF 2.1.0 log. `folders` holds the absolute `source` and `build` folders; URIs are relative to
 * `cwd`, so run the doctor from the repository root for code scanning. Each spec test is a rule; a MUST is an
 * `error`, a SHOULD a `warning`.
 */
export function toSarif(report, folders, { cwd = process.cwd() } = {}) {
  const rules = report.tests.map((test) => ({
    id: test.id,
    shortDescription: { text: test.id },
    ...(test.description ? { fullDescription: { text: test.description } } : {}),
    defaultConfiguration: { level: test.keyword === "MUST" ? "error" : "warning" },
    properties: { level: test.level, keyword: test.keyword, scope: test.scope },
  }));
  const index = new Map(rules.map((rule, i) => [rule.id, i]));
  const results = report.findings.map((finding) => {
    const result = { ruleId: finding.id, level: finding.severity === "error" ? "error" : "warning", message: { text: describe(finding) } };
    if (index.has(finding.id)) result.ruleIndex = index.get(finding.id);
    const base = finding.in === "output" ? folders.build : folders.source;
    if (finding.file && base) {
      const physicalLocation = { artifactLocation: { uri: artifactUri(base, finding.file, cwd) } };
      if (finding.line) physicalLocation.region = { startLine: finding.line, ...(finding.column ? { startColumn: finding.column } : {}) };
      result.locations = [{ physicalLocation }];
    }
    if (finding.fix) result.properties = { fix: finding.fix };
    return result;
  });
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: { driver: { ...tool, rules } },
        results,
        properties: { spec: report.spec, specVersion: report.version, level: report.level, notRun: report.notRun },
      },
    ],
  };
}
