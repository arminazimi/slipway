// When `main` moves, keep agent pull requests mergeable: call the update-branch
// API for open, non-draft pull requests from `agent/*` and `codex/*` branches
// that are behind and have no conflict, and comment once on a conflicting one
// naming its files. The API merges `main` into the branch; this script never runs
// `git push`, so a branch is never force-pushed.
//
//   node tools/ops/update.mjs
//
// `plan` is pure, so update.test.mjs runs offline on recorded API shapes.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** Branches agents push to; a pull request from any other branch is left alone. */
export const AGENT_BRANCH = /^(?:agent|codex)\//;

/** The hidden marker that lets the next run find an existing conflict comment. */
export const MARKER = "<!-- slipway-ops-update: conflict -->";

export function isAgentBranch(ref) {
  return typeof ref === "string" && AGENT_BRANCH.test(ref);
}

/** A Markdown code span for a value from the API. */
const inline = (value) => `\`${String(value).replace(/`/g, "'").replace(/\s+/g, " ").trim()}\``;

const filesOf = (pull) =>
  (pull.files ?? []).map((file) => (typeof file === "string" ? file : file?.filename)).filter(Boolean);

/** The one comment posted on a conflicting pull request. */
export function conflictComment(pull) {
  const base = pull.base?.ref ?? "main";
  const files = filesOf(pull);
  const lines = [
    MARKER,
    `\`${base}\` moved, and this pull request has conflicts, so its branch cannot be updated automatically.`,
    "",
  ];
  if (files.length) {
    lines.push("Resolve them in these files, then push:", "", ...files.map((file) => `- ${inline(file)}`));
  } else {
    lines.push(
      "GitHub did not list the files it changes. Run this locally to see the conflicts:",
      "",
      "```bash",
      `git fetch origin ${base} && git merge origin/${base}`,
      "```",
    );
  }
  lines.push("", "The branch is never force-pushed; merge the new commits and resolve the conflicts in place.");
  return lines.join("\n");
}

/**
 * Decide what to do with each open pull request. Each record carries the REST
 * pull fields plus `compare` (`GET /repos/{repo}/compare/{base}...{head}`),
 * `files` (`GET /repos/{repo}/pulls/{n}/files`) and `comments` (the issue
 * comments), so the decision needs no network.
 */
export function plan(pulls, { repo = null } = {}) {
  const update = [];
  const comment = [];
  const skip = [];

  for (const pull of pulls) {
    const number = pull.number;
    const headRepo = pull.head?.repo?.full_name;
    if (!isAgentBranch(pull.head?.ref)) {
      skip.push({ number, reason: "not an agent branch" });
    } else if (pull.draft) {
      skip.push({ number, reason: "draft" });
    } else if (repo && headRepo && headRepo !== repo) {
      // The workflow token cannot write to another repository's branch.
      skip.push({ number, reason: "from a fork" });
    } else if (pull.mergeable === false) {
      if ((pull.comments ?? []).some((comment) => (comment.body ?? "").includes(MARKER))) {
        skip.push({ number, reason: "conflicted, already commented" });
      } else {
        comment.push({ number, files: filesOf(pull), body: conflictComment(pull) });
      }
    } else if (pull.mergeable !== true) {
      skip.push({ number, reason: "mergeability unknown" });
    } else if (!(Number(pull.compare?.behind_by) > 0)) {
      skip.push({ number, reason: pull.compare ? "up to date" : "no comparison" });
    } else {
      update.push({ number, headSha: pull.head.sha });
    }
  }

  return { update, comment, skip };
}

function defaultGh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 1e8,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function ghList(gh, path) {
  const pages = JSON.parse(gh(["api", path, "--paginate", "--slurp"]));
  return Array.isArray(pages) ? pages.flat() : [pages];
}

/**
 * One open pull request with the detail REST omits from the list (a fresh
 * `mergeable`), the comparison that says whether it is behind, and everything
 * the conflict comment needs.
 */
function read(gh, repo, pull) {
  const detail = JSON.parse(gh(["api", `repos/${repo}/pulls/${pull.number}`]));
  const merged = { ...pull, ...detail };
  if (merged.mergeable === false) {
    merged.files = ghList(gh, `repos/${repo}/pulls/${pull.number}/files?per_page=100`);
    merged.comments = ghList(gh, `repos/${repo}/issues/${pull.number}/comments?per_page=100`);
  } else if (merged.mergeable === true) {
    const base = merged.base?.ref ?? "main";
    merged.compare = JSON.parse(
      gh(["api", `repos/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(merged.head.sha)}`]),
    );
  }
  return merged;
}

/**
 * The workflow entry point. Updates and comments are independent: one failure is
 * logged and the rest still run, and the next push to `main` retries it.
 */
export function main({ env = process.env, gh = defaultGh, log = console } = {}) {
  const skip = (reason) => {
    log.log(`ops-update: ${reason}`);
    return { updated: [], commented: [], skipped: [], reason };
  };

  const repo = env.GITHUB_REPOSITORY;
  if (!repo) return skip("GITHUB_REPOSITORY is not set");

  const open = ghList(gh, `repos/${repo}/pulls?state=open&per_page=100`).filter((pull) =>
    isAgentBranch(pull.head?.ref),
  );
  const pulls = [];
  for (const pull of open) {
    try {
      pulls.push(read(gh, repo, pull));
    } catch (error) {
      log.log(`ops-update: could not read #${pull.number}: ${String(error.stderr ?? "").trim() || error.message}`);
    }
  }

  const decision = plan(pulls, { repo });
  const updated = [];
  const commented = [];

  for (const pull of decision.update) {
    try {
      gh([
        "api",
        `repos/${repo}/pulls/${pull.number}/update-branch`,
        "-X",
        "PUT",
        "-f",
        `expected_head_sha=${pull.headSha}`,
      ]);
      updated.push(pull.number);
      log.log(`ops-update: updated #${pull.number}`);
    } catch (error) {
      log.log(`ops-update: could not update #${pull.number}: ${String(error.stderr ?? "").trim() || error.message}`);
    }
  }

  for (const pull of decision.comment) {
    try {
      gh(["api", `repos/${repo}/issues/${pull.number}/comments`, "-X", "POST", "-f", `body=${pull.body}`]);
      commented.push(pull.number);
      log.log(`ops-update: commented on the conflicts in #${pull.number}`);
    } catch (error) {
      log.log(`ops-update: could not comment on #${pull.number}: ${String(error.stderr ?? "").trim() || error.message}`);
    }
  }

  for (const pull of decision.skip) log.log(`ops-update: skipped #${pull.number}: ${pull.reason}`);
  log.log(`ops-update: updated ${updated.length}, commented ${commented.length}, skipped ${decision.skip.length}`);
  return { updated, commented, skipped: decision.skip };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    const detail = String(error.stderr ?? "").trim() || error.message;
    console.error(`ops-update: ${detail}`);
    process.exitCode = 1;
  }
}
