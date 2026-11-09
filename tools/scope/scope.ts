// Fail when a pull request changes a file its issue's brief does not list.
//
//   node tools/scope/scope.ts        (in scope.yml; reads the pull request and its issue through the API)
//
// The brief lists paths in backticks under `## Files`: exact paths, folders (a trailing `/`) and
// globs (`*` stays inside a folder, `**` crosses folders). `changelog.d/<n>.md` is always allowed,
// and the label `scope: wide` skips the check. The issue text is data: it is only matched against.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** The paths a brief lists under `## Files`; null when it has no such section. */
export function briefPaths(issueBody) {
  const lines = String(issueBody ?? "").split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+Files\s*$/i.test(line));
  if (start === -1) return null;
  const paths = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    for (const match of line.matchAll(/`([^`\s]+)`/g)) paths.push(match[1].replace(/^\.\//, ""));
  }
  return paths;
}

/** A glob, folder or exact path as a RegExp over repository-relative paths. */
export function toRegExp(pattern) {
  if (pattern.endsWith("/")) pattern += "**";
  let source = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*" && pattern[i + 1] === "*") {
      i++;
      if (pattern[i + 1] === "/") { i++; source += "(?:.*/)?"; } else source += ".*";
    } else if (c === "*") source += "[^/]*";
    else if (c === "?") source += "[^/]";
    else source += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`);
}

/**
 * @param {{ briefs: (string[]|null)[], files: string[], issues: number[], labels?: string[] }} input
 * @returns {{ outside: string[], notice: string|null }}
 */
export function check({ briefs, files, issues = [], labels = [] }) {
  if (labels.includes("scope: wide")) return { outside: [], notice: "The `scope: wide` label skips the scope check." };
  const listed = briefs.filter(Boolean);
  if (listed.length === 0) {
    return { outside: [], notice: "The linked issue has no `## Files` section, so there is no scope to check." };
  }
  const allowed = [...listed.flat().map(toRegExp), ...issues.map((n) => new RegExp(`^changelog\\.d/${n}\\.md$`))];
  return { outside: files.filter((file) => !allowed.some((re) => re.test(file))), notice: null };
}

const gh = (...args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** `Closes #12`, `fixes #12`, `Resolved #12` (any case). */
function closedIssues(body) {
  const numbers = [];
  for (const m of String(body ?? "").matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s+#(\d+)\b/gi)) numbers.push(Number(m[1]));
  return [...new Set(numbers)];
}

function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const number = process.env.PR_NUMBER;
  if (!repo || !/^\d+$/.test(number ?? "")) throw new Error("GITHUB_REPOSITORY and PR_NUMBER are required");

  const pull = JSON.parse(gh("api", `repos/${repo}/pulls/${number}`));
  const files = JSON.parse(gh("api", "--paginate", "--slurp", `repos/${repo}/pulls/${number}/files?per_page=100`))
    .flat()
    .flatMap((f) => [f.filename, f.previous_filename])
    .filter(Boolean);
  const issues = closedIssues(pull.body);
  const briefs = issues.map((n) => briefPaths(JSON.parse(gh("api", `repos/${repo}/issues/${n}`)).body));
  const labels = (pull.labels ?? []).map((l) => l.name);

  const { outside, notice } = check({ briefs, files, issues, labels });
  if (notice) console.log(`scope: ${notice}`);
  if (outside.length === 0) return console.log("scope: ok");
  for (const file of outside) console.log(`::error file=${file}::${file} is not listed under Files in the issue's brief`);
  console.log(`scope: ${outside.length} file(s) outside the brief:\n${outside.map((f) => `  ${f}`).join("\n")}`);
  console.log("Edit only the listed files, or ask a maintainer for the `scope: wide` label.");
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
