// Two agents editing one file is the main cause of conflicts, so every open pull
// request gets one sticky comment listing the files another open pull request also
// edits, and the comment is removed when the overlap is gone. Fragments under
// changelog.d/ are written by every pull request and never count as an overlap.
//
//   node tools/ops/overlap.mjs
//
// `plan` is pure, so overlap.test.mjs runs offline on recorded API shapes.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/** The hidden marker that lets the next run find its own comment. */
export const MARKER = "<!-- slipway-ops-overlap -->";

/** Files every pull request may add without colliding with another. */
const IGNORED = /^changelog\.d\//;

/** The files a pull request changes, without the changelog fragments, sorted and unique. */
export function changedFiles(pull) {
  const files = (pull.files ?? [])
    .map((file) => (typeof file === "string" ? file : file?.filename))
    .filter((file) => file && !IGNORED.test(file));
  return [...new Set(files)].sort();
}

/** file -> the pull request numbers that change it. */
export function filesByPull(pulls) {
  const byFile = new Map();
  for (const pull of pulls) {
    for (const file of changedFiles(pull)) {
      if (!byFile.has(file)) byFile.set(file, new Set());
      byFile.get(file).add(pull.number);
    }
  }
  return byFile;
}

/** The one sticky comment for a pull request: each shared file and the pull requests that share it. */
export function overlapComment(pull, byFile) {
  const lines = [
    MARKER,
    "",
    "Another open pull request edits the same files. Two agents in one file usually conflict, so merge one first or coordinate with its author:",
  ];
  for (const [file, numbers] of [...byFile.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const others = [...numbers]
      .filter((number) => number !== pull.number)
      .sort((a, b) => a - b)
      .map((number) => `#${number}`);
    if (others.length) lines.push("", `- \`${file}\` — also in ${others.join(", ")}`);
  }
  return lines.join("\n");
}

/**
 * Decide what to write for each pull request. A pull request carries `number`,
 * `files` (`GET /repos/{repo}/pulls/{n}/files`) and `comments` (the issue
 * comments), so the decision needs no network.
 */
export function plan(pulls) {
  const byFile = filesByPull(pulls);
  const write = [];
  const remove = [];
  const skip = [];

  for (const pull of pulls) {
    const files = new Map(
      [...byFile.entries()].filter(([, numbers]) => numbers.size > 1 && numbers.has(pull.number)),
    );
    const existing = (pull.comments ?? []).find((comment) => (comment.body ?? "").includes(MARKER));

    if (files.size === 0) {
      if (existing) remove.push({ number: pull.number, commentId: existing.id });
      else skip.push({ number: pull.number, reason: "no overlap" });
      continue;
    }

    write.push({ number: pull.number, commentId: existing?.id ?? null, body: overlapComment(pull, files) });
  }

  return { write, remove, skip };
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

function read(gh, repo, pull) {
  return {
    ...pull,
    files: ghList(gh, `repos/${repo}/pulls/${pull.number}/files?per_page=100`),
    comments: ghList(gh, `repos/${repo}/issues/${pull.number}/comments?per_page=100`),
  };
}

/** One failure is logged and the rest still run; the next pull request event retries it. */
export function main({ env = process.env, gh = defaultGh, log = console } = {}) {
  const repo = env.GITHUB_REPOSITORY;
  if (!repo) {
    log.log("ops-overlap: GITHUB_REPOSITORY is not set");
    return { written: [], removed: [], skipped: [] };
  }

  const pulls = [];
  for (const pull of ghList(gh, `repos/${repo}/pulls?state=open&per_page=100`)) {
    try {
      pulls.push(read(gh, repo, pull));
    } catch (error) {
      log.log(`ops-overlap: could not read #${pull.number}: ${String(error.stderr ?? "").trim() || error.message}`);
    }
  }

  const decision = plan(pulls);
  const written = [];
  const removed = [];

  for (const item of decision.write) {
    try {
      if (item.commentId) {
        gh(["api", `repos/${repo}/issues/comments/${item.commentId}`, "-X", "PATCH", "-f", `body=${item.body}`]);
      } else {
        gh(["api", `repos/${repo}/issues/${item.number}/comments`, "-X", "POST", "-f", `body=${item.body}`]);
      }
      written.push(item.number);
      log.log(`ops-overlap: commented on #${item.number}`);
    } catch (error) {
      log.log(`ops-overlap: could not comment on #${item.number}: ${String(error.stderr ?? "").trim() || error.message}`);
    }
  }

  for (const item of decision.remove) {
    try {
      gh(["api", `repos/${repo}/issues/comments/${item.commentId}`, "-X", "DELETE"]);
      removed.push(item.number);
      log.log(`ops-overlap: removed the comment on #${item.number}`);
    } catch (error) {
      log.log(`ops-overlap: could not remove the comment on #${item.number}: ${String(error.stderr ?? "").trim() || error.message}`);
    }
  }

  for (const item of decision.skip) log.log(`ops-overlap: skipped #${item.number}: ${item.reason}`);
  log.log(`ops-overlap: wrote ${written.length}, removed ${removed.length}, skipped ${decision.skip.length}`);
  return { written, removed, skipped: decision.skip };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    const detail = String(error.stderr ?? "").trim() || error.message;
    console.error(`ops-overlap: ${detail}`);
    process.exitCode = 1;
  }
}
