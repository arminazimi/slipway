// The dependency graph of the roadmap, read from the issues themselves so it
// works on any branch. Every roadmap issue names its key in an HTML comment and
// lists the issues it waits on under "## Depends on".

const KEY = /<!--\s*slipway-roadmap-key:\s*([^>]*?)\s*-->/;
const DEPENDS = /##\s+Depends on[ \t]*\n([\s\S]*?)(?=\n##\s|$)/;
const CLOSES =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s+(?:#(\d+)|https?:\/\/\S*?\/issues\/(\d+))/gi;

const label = (issue, name) =>
  (issue.labels ?? []).some((l) => (typeof l === "string" ? l : l.name) === name);

const isEpic = (issue) => label(issue, "type: epic");
const isMaintainer = (issue) => label(issue, "lane: maintainer");
const byNumber = (a, b) => a.number - b.number;

export function roadmapKey(issue) {
  return issue.body?.match(KEY)?.[1] ?? null;
}

export function dependencies(issue) {
  const section = issue.body?.match(DEPENDS)?.[1];
  if (!section) return [];
  const numbers = [...section.matchAll(/#(\d+)|issues\/(\d+)/g)].map((m) =>
    Number(m[1] ?? m[2]),
  );
  return [...new Set(numbers)];
}

// Open issues the roadmap knows about. Pull requests and unclaimed issues are
// not nodes in the graph.
function tasks(issues) {
  return issues.filter(
    (issue) => !issue.pull_request && issue.state === "open" && roadmapKey(issue),
  );
}

function closedNumbers(issues) {
  return new Set(
    issues.filter((issue) => issue.state === "closed").map((issue) => issue.number),
  );
}

// An open pull request saying "Closes #n" means #n is being worked on.
export function inProgress(issues) {
  const closing = new Set();
  for (const pull of issues) {
    if (!pull.pull_request || pull.state !== "open") continue;
    for (const match of (pull.body ?? "").matchAll(CLOSES)) {
      closing.add(Number(match[1] ?? match[2]));
    }
  }
  return tasks(issues)
    .filter((issue) => closing.has(issue.number))
    .sort(byNumber);
}

// Ready: a task whose every dependency is closed and that nobody has claimed
// with a pull request yet. Epics are containers, and a maintainer task is never
// dispatched to an agent.
export function ready(issues) {
  const done = closedNumbers(issues);
  const busy = new Set(inProgress(issues).map((issue) => issue.number));
  return tasks(issues)
    .filter((issue) => !isEpic(issue) && !isMaintainer(issue))
    .filter((issue) => dependencies(issue).every((n) => done.has(n)))
    .filter((issue) => !busy.has(issue.number))
    .sort(byNumber);
}

// Blocked: a task that waits on at least one issue still open, or on an issue
// the input does not know (an absent dependency is not assumed closed).
export function blocked(issues) {
  const done = closedNumbers(issues);
  return tasks(issues)
    .filter((issue) => !isEpic(issue) && !isMaintainer(issue))
    .filter((issue) => dependencies(issue).some((n) => !done.has(n)))
    .sort(byNumber);
}
