import { execFileSync } from "node:child_process";
import { relative, resolve, sep } from "node:path";

/** What git says about a page's last review: the last commit that touched its source file. */
export interface Review {
  /** The committer instant of that commit, in UTC ISO 8601 (`Date#toISOString`), the same string on every machine. */
  readonly date: string;
  /** The author name of that commit, with `.mailmap` applied (`%aN`). */
  readonly author: string;
}

/** The answer when git has no history for a file: no git, no commit, or a path outside the root. */
export const UNKNOWN = "unknown";

/** A page's last review, or {@link UNKNOWN} when there is no history to read. */
export type ReviewLookup = Review | typeof UNKNOWN;

/** What one repository costs: one work-tree check, and one `git log` per page path, cached. */
interface History {
  /** True when the root is inside a git work tree; the reviews in `cache` are trusted only then. */
  readonly available: boolean;
  /** Reviews by root-relative path (forward slashes), so one file is asked about once per process. */
  readonly cache: Map<string, ReviewLookup>;
}

/** One history per resolved root, so a caller asking about many pages pays for the work-tree check once. */
const HISTORIES = new Map<string, History>();

/** Checks once whether `root` is inside a work tree, so a folder outside git never pays for `git log` per page. */
function historyAt(root: string): History {
  const found = HISTORIES.get(root);
  if (found !== undefined) return found;

  let available = false;
  try {
    available =
      execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() === "true";
  } catch {
    available = false;
  }
  const history: History = { available, cache: new Map() };
  HISTORIES.set(root, history);
  return history;
}

/**
 * The path git should be asked about, relative to `root` with forward slashes; `undefined` when the path is empty,
 * the root itself, or resolves outside the root. A path outside the root would let a page borrow another file's
 * history, so it is never asked about.
 */
function gitPathOf(root: string, pageFile: string): string | undefined {
  if (pageFile === "") return undefined;
  const full = resolve(root, pageFile);
  const prefix = root.endsWith(sep) ? root : `${root}${sep}`;
  if (full === root || !full.startsWith(prefix)) return undefined;
  return relative(root, full).split(/[\\/]/).join("/");
}

/** Runs `git log` for one path and parses its answer; any failure, including a missing git, is {@link UNKNOWN}. */
function readReview(root: string, path: string): ReviewLookup {
  let text: string;
  try {
    text = execFileSync("git", ["log", "-1", "--format=%cI%x00%aN", "--", path], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return UNKNOWN;
  }

  // `%cI` has no spaces, so the first NUL separates the date from the author, and git ends the record with a newline.
  const [date = "", author = ""] = text.replace(/\r?\n$/, "").split("\0");
  const trimmedDate = date.trim();
  const trimmedAuthor = author.trim();
  if (trimmedDate === "" || trimmedAuthor === "") return UNKNOWN;

  // Git's `%cI` text spells UTC as `Z` on some versions and `+00:00` on others; one canonical instant keeps a fixed
  // repository's answer byte-identical across machines. Parsing a recorded date never reads the clock.
  const instant = new Date(trimmedDate);
  return Number.isNaN(instant.getTime()) ? UNKNOWN : { date: instant.toISOString(), author: trimmedAuthor };
}

/**
 * The last commit that touched `pageFile`, as its committer date and author name, for the "last reviewed by" line.
 * `pageFile` is relative to `root` (or absolute inside it); a path outside the root is {@link UNKNOWN}, never another
 * file's history.
 *
 * The answer comes from `git log -1 --format=%cI%x00%aN -- <path>`, so `%aN` applies the repository's `.mailmap`.
 * The date is the commit instant in UTC, so git's choice of `Z` or `+00:00` is not visible. A root outside a git work
 * tree, a file git has never seen, and a missing git all read {@link UNKNOWN}; this function never throws and never
 * reads the clock. Each root and path is asked about once per process and then cached, so a fixed repository gives the
 * same answer every time while a commit made later in the same process is not seen.
 *
 * This is a machine input: the answer depends on the repository's history and `.mailmap`, which are not part of the
 * site's source. A copy of the site without its history reports {@link UNKNOWN}; a build on a machine without git
 * does too.
 */
export function reviewers(root: string, pageFile: string): ReviewLookup {
  const base = resolve(root);
  const path = gitPathOf(base, pageFile);
  if (path === undefined) return UNKNOWN;

  const history = historyAt(base);
  if (!history.available) return UNKNOWN;

  const cached = history.cache.get(path);
  if (cached !== undefined) return cached;

  const review = readReview(base, path);
  history.cache.set(path, review);
  return review;
}
