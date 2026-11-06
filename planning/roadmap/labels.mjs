// Label definitions, lanes, sizes, priorities, and how roadmap items map to labels.

export const LANES = {
  "strong-agent": { label: "lane: strong-agent", who: "a strong coding agent or an experienced contributor" },
  "free-agent": { label: "lane: free-agent", who: "free or lightweight agents, and newcomers" },
  maintainer: { label: "lane: maintainer", who: "a maintainer (accounts, credentials, or decisions)" },
};

export const SIZES = {
  XS: { label: "size: XS", meaning: "under an hour" },
  S: { label: "size: S", meaning: "a few hours" },
  M: { label: "size: M", meaning: "about a day" },
};

/** Priority: how much the release needs the item. Execution order comes from dependencies first, then priority. */
export const PRIORITIES = {
  P0: { label: "priority: P0", meaning: "on the critical path: other work waits for it" },
  P1: { label: "priority: P1", meaning: "required for the release" },
  P2: { label: "priority: P2", meaning: "required for the release, can land late" },
  P3: { label: "priority: P3", meaning: "nice to have in the release" },
};

export const TRACKS = {};

/** Area labels per epic. Every epic in ROADMAP.md must appear here. */
export const EPIC_AREAS = {
  "E-foundation": ["area: core", "area: devops"],
  "E-engine": ["area: engine"],
  "E-outputs": ["area: engine", "area: agent"],
  "E-design": ["area: design"],
  "E-layouts": ["area: theme"],
  "E-components": ["area: theme"],
  "E-quality": ["area: devops", "area: theme"],
  "E-tooling": ["area: agent", "area: core"],
  "E-evergreen": ["area: dogfood"],
  "E-site": ["area: docs"],
  "E-cleanup": ["area: core", "area: devops"],
  "E-release": ["area: docs", "area: devops"],
};

/** Type label from a task key prefix. First match wins. */
export const TYPE_BY_PREFIX = [
  ["adr.", "type: adr"],
  ["engine.", "type: engine"],
  ["output.", "type: engine"],
  ["design.", "type: design"],
  ["layout.", "type: layout"],
  ["component.", "type: component"],
  ["quality.", "type: test"],
  ["tooling.", "type: tooling"],
  ["evergreen.", "type: migration"],
  ["site.", "type: docs"],
  ["cleanup.", "type: removal"],
  ["release.", "type: docs"],
];

const L = (name, color, description) => ({ name, color, description });

export const LABELS = [
  L("roadmap", "0e8a16", "Work committed in the public roadmap"),
  L("type: epic", "3e4b9e", "Tracking issue that groups small tasks"),
  L("type: task", "c5def5", "One small, independently mergeable change"),
  L("type: adr", "1d76db", "Architecture decision record"),
  L("type: engine", "1d76db", "The site engine: content model, pipeline, and outputs"),
  L("type: design", "1d76db", "Design system: tokens, type, color, and mockups"),
  L("type: layout", "1d76db", "Theme layout or page chrome"),
  L("type: component", "1d76db", "Content component used inside pages"),
  L("type: test", "1d76db", "Tests and quality gates"),
  L("type: tooling", "1d76db", "doctor, MCP, Skills, and command-line tools"),
  L("type: migration", "1d76db", "Moving a site onto the engine"),
  L("type: docs", "1d76db", "Documentation"),
  L("type: removal", "1d76db", "Removing Jekyll or non-docs code"),
  L("lane: strong-agent", "5319e7", "Needs a strong coding agent or experienced contributor"),
  L("lane: free-agent", "7057ff", "Spec-complete: suitable for free agents and new contributors"),
  L("lane: maintainer", "b60205", "Requires maintainer accounts, credentials, or decisions"),
  L("size: XS", "ededed", "Expected effort: under 1 hour"),
  L("size: S", "d4c5f9", "Expected effort: a few hours"),
  L("size: M", "bfd4f2", "Expected effort: about a day"),
  L("priority: P0", "b60205", "Critical path: other work waits for it"),
  L("priority: P1", "d93f0b", "Required for the release"),
  L("priority: P2", "fbca04", "Required for the release, can land late"),
  L("priority: P3", "c2e0c6", "Nice to have in the release"),
  L("status: ready", "0e8a16", "Every dependency is closed: an agent can start now"),
  L("status: needs-brief", "fbca04", "No agent brief yet: comment with a plan before opening a PR"),
  L("area: core", "006b75", "Repository structure, configuration, and architecture"),
  L("area: engine", "006b75", "The TypeScript site engine"),
  L("area: design", "006b75", "Design system, tokens, and mockups"),
  L("area: theme", "006b75", "Layouts, components, and styling"),
  L("area: agent", "006b75", "Agent-native output, doctor, Skills, MCP, and editing"),
  L("area: devops", "006b75", "CI and repository automation"),
  L("area: docs", "006b75", "Documentation and Slipway's own site"),
  L("area: dogfood", "006b75", "Slipway on the maintainer's own sites, Evergreen first"),
];

/** Labels GitHub creates by default and the generator may also use. */
export const BUILTIN_LABELS = ["good first issue", "help wanted", "bug", "documentation", "enhancement"];

export function typeFor(key) {
  return TYPE_BY_PREFIX.find(([prefix]) => key.startsWith(prefix))?.[1] ?? null;
}
