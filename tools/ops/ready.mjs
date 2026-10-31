// `status: ready` means an agent can start on the issue now. The label is kept
// true by comparing it with the roadmap graph: a task whose dependencies are all
// closed gets the label; a blocked task loses it. Closed issues, epics,
// maintainer tasks, unclaimed issues, pull requests, and tasks already claimed
// by an open pull request are left alone. One label change is one API call, and
// the issues are read once.
//
//   node tools/ops/ready.mjs
//
// `plan` is pure, so ready.test.mjs runs offline on recorded API shapes.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { blocked, ready } from "./graph.mjs";
import { readIssues } from "./github.mjs";

/** The label this script owns. */
export const READY = "status: ready";

const label = (issue, name) =>
  (issue.labels ?? []).some((l) => (typeof l === "string" ? l : l.name) === name);

/**
 * Decide which labels to change. `ready()` and `blocked()` already exclude
 * closed issues, pull requests, epics, maintainer tasks, issues without a
 * roadmap key, and tasks claimed by an open pull request.
 */
export function plan(issues) {
  const add = ready(issues)
    .filter((issue) => !label(issue, READY))
    .map((issue) => issue.number);
  const remove = blocked(issues)
    .filter((issue) => label(issue, READY))
    .map((issue) => issue.number);
  return { add, remove };
}

function defaultGh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 1e8,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** One failure is logged and the rest still run; the next run retries it. */
export function main({ env = process.env, gh = defaultGh, log = console, read = readIssues } = {}) {
  const repo = env.GITHUB_REPOSITORY ?? env.GH_REPO;
  if (!repo) {
    log.log("ops-ready: GITHUB_REPOSITORY is not set");
    return { added: [], removed: [] };
  }

  const decision = plan(read(repo));
  const added = [];
  const removed = [];

  for (const number of decision.add) {
    try {
      gh(["api", `repos/${repo}/issues/${number}/labels`, "--method", "POST", "-f", `labels[]=${READY}`]);
      added.push(number);
      log.log(`ops-ready: added ${READY} to #${number}`);
    } catch (error) {
      log.log(
        `ops-ready: could not add ${READY} to #${number}: ${String(error.stderr ?? "").trim() || error.message}`,
      );
    }
  }

  for (const number of decision.remove) {
    try {
      gh([
        "api",
        `repos/${repo}/issues/${number}/labels/${encodeURIComponent(READY)}`,
        "--method",
        "DELETE",
      ]);
      removed.push(number);
      log.log(`ops-ready: removed ${READY} from #${number}`);
    } catch (error) {
      log.log(
        `ops-ready: could not remove ${READY} from #${number}: ${String(error.stderr ?? "").trim() || error.message}`,
      );
    }
  }

  log.log(`ops-ready: added ${added.length}, removed ${removed.length}`);
  return { added, removed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    const detail = String(error.stderr ?? "").trim() || error.message;
    console.error(`ops-ready: ${detail}`);
    process.exitCode = 1;
  }
}
