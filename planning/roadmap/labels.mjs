// Label definitions, lanes, sizes, and how roadmap items map to labels.

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

export const TRACKS = {};

/** Area labels per epic. Every epic in ROADMAP.md must appear here. */
export const EPIC_AREAS = {
  "E-foundation": ["area: core", "area: devops"],
  "E-spikes": ["area: core"],
  "E-brand": ["area: brand"],
  "E-theme-tokens": ["area: theme"],
  "E-theme-layouts": ["area: theme", "area: i18n"],
  "E-standalone": ["area: core", "area: devops"],
  "E-spec": ["area: standards", "area: agent"],
  "E-blocks": ["area: core", "area: theme"],
  "E-publishing": ["area: theme"],
  "E-design": ["area: theme"],
  "E-theme-ai": ["area: theme", "area: agent"],
  "E-source-map": ["area: agent", "area: standards"],
  "E-schemas": ["area: agent", "area: core"],
  "E-agent-interface": ["area: agent"],
  "E-i18n": ["area: i18n"],
  "E-adapters": ["area: standards", "area: ecosystem"],
  "E-agent-tooling": ["area: agent", "area: standards"],
  "E-agent-reach": ["area: agent", "area: community"],
  "E-docs-site": ["area: docs"],
  "E-quality": ["area: devops", "area: theme"],
  "E-growth": ["area: community"],
  "E-seaworthy": ["area: standards", "area: devops"],
  "E-starters": ["area: starters"],
  "E-launch": ["area: community"],
  "E-extensions": ["area: core"],
  "E-migration": ["area: agent", "area: starters"],
  "E-standard": ["area: standards"],
  "E-evergreen": ["area: dogfood", "area: core"],
  "E-parallel": ["area: devops"],
  "E-doctor-checks": ["area: agent", "area: standards"],
  "E-blocks-2": ["area: core", "area: theme"],
  "E-docs-kit": ["area: theme"],
  "E-rtl-2": ["area: i18n"],
  "E-adapters-2": ["area: standards", "area: ecosystem"],
  "E-mcp-3": ["area: agent"],
  "E-cli": ["area: core", "area: agent"],
  "E-recipes": ["area: docs"],
  "E-quality-2": ["area: devops", "area: theme"],
  "E-starters-2": ["area: starters"],
  "E-lifecycle": ["area: devops", "area: dogfood"],
};

/** Type label from a task key prefix. First match wins. */
export const TYPE_BY_PREFIX = [
  ["spike.", "type: spike"],
  ["theme.", "type: layout"],
  ["starter.", "type: starter"],
  ["migrate.", "type: migration"],
  ["ext.presets", "type: preset"],
  ["ext.blocks", "type: block"],
  ["block.", "type: block"],
  ["adapter.", "type: adapter"],
  ["astro.", "type: adapter"],
  ["qa.", "type: test"],
  ["i18n.pseudo-rtl", "type: test"],
  ["perf.", "type: test"],
  ["sourcemap.e2e", "type: test"],
  ["launch2.visual-tests", "type: test"],
];

const L = (name, color, description) => ({ name, color, description });

export const LABELS = [
  L("roadmap", "0e8a16", "Work committed in the public roadmap"),
  L("type: epic", "3e4b9e", "Tracking issue that groups small tasks"),
  L("type: task", "c5def5", "One small, independently mergeable change"),
  L("type: layout", "1d76db", "Theme layout, component, or styling"),
  L("type: starter", "1d76db", "Starter site"),
  L("type: migration", "1d76db", "Migration from another theme"),
  L("type: block", "1d76db", "Content block"),
  L("type: preset", "1d76db", "Theme preset or token bundle"),
  L("type: test", "1d76db", "Tests and quality gates"),
  L("type: adapter", "1d76db", "Adapter that brings the spec to another site generator"),
  L("type: spike", "1d76db", "Time-boxed investigation that ends in an ADR"),
  L("lane: strong-agent", "5319e7", "Needs a strong coding agent or experienced contributor"),
  L("lane: free-agent", "7057ff", "Spec-complete: suitable for free agents and new contributors"),
  L("lane: maintainer", "b60205", "Requires maintainer accounts, credentials, or decisions"),
  L("size: XS", "ededed", "Expected effort: under 1 hour"),
  L("size: S", "d4c5f9", "Expected effort: a few hours"),
  L("size: M", "bfd4f2", "Expected effort: about a day"),
  L("status: needs-brief", "fbca04", "No agent brief yet: comment with a plan before opening a PR"),
  L("needs: seaworthy", "c2e0c6", "Waits on a Seaworthy deliverable; see Depends on Seaworthy in ROADMAP.md"),
  L("area: core", "006b75", "Theme engine, config, and architecture"),
  L("area: theme", "006b75", "Layouts, tokens, and styling"),
  L("area: i18n", "006b75", "RTL, languages, and localization"),
  L("area: agent", "006b75", "Agent-native output, Skills, MCP, and editing"),
  L("area: starters", "006b75", "Starter sites"),
  L("area: devops", "006b75", "CI and repository automation"),
  L("area: brand", "006b75", "Name, logo, and launch assets"),
  L("area: community", "006b75", "Contributors, launches, and outreach"),
  L("area: standards", "006b75", "Source maps and the agent-editable site spec"),
  L("area: ecosystem", "006b75", "Other site generators and adapters"),
  L("area: docs", "006b75", "Slipway's documentation site"),
  L("area: dogfood", "006b75", "Slipway on the maintainer's own sites, Evergreen first"),
];

/** Labels GitHub creates by default and the generator may also use. */
export const BUILTIN_LABELS = ["good first issue", "help wanted", "bug", "documentation", "enhancement"];

export function typeFor(key) {
  return TYPE_BY_PREFIX.find(([prefix]) => key.startsWith(prefix))?.[1] ?? null;
}
