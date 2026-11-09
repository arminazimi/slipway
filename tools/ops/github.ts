import { execFileSync } from "node:child_process";

const REPO = "arminazimi/slipway";

function ghApi(path) {
  const text = execFileSync("gh", ["api", path, "--paginate", "--slurp"], {
    encoding: "utf8",
    maxBuffer: 1e8,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(text).flat();
}

// Every issue and pull request, open or closed, so dependencies resolve against
// closed issues and open pull requests show what is in progress.
export function readIssues(repo = REPO) {
  return ghApi(`repos/${repo}/issues?state=all&per_page=100`);
}
