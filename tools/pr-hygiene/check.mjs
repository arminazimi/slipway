// Two rules every agent pull request follows: the body says `Closes #<issue>`, and a change to
// files a site owner sees adds `changelog.d/<issue>.md`. The label `no-changelog` skips the second.
//
//   node tools/pr-hygiene/check.mjs        (in pr-hygiene.yml; reads the pull request through the API)
//
// `check` is pure: body, changed files and labels in, a list of problems out.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** The hidden marker that lets the next run find its own comment. */
export const MARKER = "<!-- slipway-pr-hygiene -->";

/** Folders a site owner sees; a change under one needs a changelog fragment. */
const SITE_OWNER = /^(_layouts|_includes|assets|schema|skills)\//;

/** `Closes #12`, `fixes #12`, `Resolved #12` (any case) and the numbers they name. */
export function closedIssues(body) {
  const numbers = [];
  for (const match of String(body ?? "").matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s+#(\d+)\b/gi)) {
    numbers.push(Number(match[1]));
  }
  return [...new Set(numbers)];
}

/** @returns {string[]} the problems; empty when the pull request is fine. */
export function check({ body = "", files = [], labels = [] } = {}) {
  const names = files.map((file) => (typeof file === "string" ? file : file?.filename)).filter(Boolean);
  const issues = closedIssues(body);
  const problems = [];

  if (issues.length === 0) {
    problems.push("The description has no `Closes #<issue>` line. One pull request closes one issue; add `Closes #<number>`.");
  }

  const labelNames = labels.map((label) => (typeof label === "string" ? label : label?.name));
  if (!labelNames.includes("no-changelog")) {
    const touched = names.filter((file) => SITE_OWNER.test(file));
    if (touched.length > 0) {
      const fragments = issues.map((n) => `changelog.d/${n}.md`);
      const hasFragment = fragments.length > 0
        ? fragments.some((fragment) => names.includes(fragment))
        : names.some((file) => /^changelog\.d\/\d+\.md$/.test(file));
      if (!hasFragment) {
        const wanted = fragments.length > 0 ? fragments.join(" or ") : "changelog.d/<issue>.md";
        problems.push(
          `This pull request changes files a site owner sees (${touched.slice(0, 3).map((f) => `\`${f}\``).join(", ")}${touched.length > 3 ? ", …" : ""}) but adds no \`${wanted}\` with one line. Add it, or ask a maintainer for the \`no-changelog\` label.`,
        );
      }
    }
  }
  return problems;
}

/** The sticky comment body for a list of problems. */
export function comment(problems) {
  return [MARKER, "", "This pull request breaks a repository rule:", "", ...problems.map((p) => `- ${p}`)].join("\n");
}

const gh = (...args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  const number = process.env.PR_NUMBER;
  if (!repo || !/^\d+$/.test(number ?? "")) throw new Error("GITHUB_REPOSITORY and PR_NUMBER are required");

  const pull = JSON.parse(gh("api", `repos/${repo}/pulls/${number}`));
  const files = JSON.parse(gh("api", "--paginate", "--slurp", `repos/${repo}/pulls/${number}/files?per_page=100`)).flat();
  const comments = JSON.parse(gh("api", "--paginate", "--slurp", `repos/${repo}/issues/${number}/comments?per_page=100`)).flat();
  const existing = comments.find((c) => (c.body ?? "").includes(MARKER));

  const problems = check({ body: pull.body, files, labels: pull.labels });
  if (problems.length === 0) {
    if (existing) gh("api", "-X", "DELETE", `repos/${repo}/issues/comments/${existing.id}`);
    console.log("pr-hygiene: ok");
    return;
  }
  const body = comment(problems);
  if (existing) gh("api", "-X", "PATCH", `repos/${repo}/issues/comments/${existing.id}`, "-f", `body=${body}`);
  else gh("api", `repos/${repo}/issues/${number}/comments`, "-f", `body=${body}`);
  for (const problem of problems) console.log(`pr-hygiene: ${problem}`);
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
