// Tasks already finished before their issues existed. apply.mjs creates these issues and closes them with a note.
export const DONE = {
  "foundation.issue-gen": "Done in the initial commit: planning/roadmap/ is ported from Seaworthy and parses, validates, and syncs ROADMAP.md.",
  "foundation.agents-md": "Done in the initial commit: AGENTS.md and CLAUDE.md.",
  "foundation.contributing": "Done in the initial commit: CONTRIBUTING.md with lanes, sizes, and the claim process.",
};

/**
 * Issues that already exist in Seaworthy (labeled `moved: theme`, ADR 0009 there). apply.mjs transfers them here
 * with `gh issue transfer`, which keeps their history, instead of creating new ones. Keys match ROADMAP.md.
 */
export const TRANSFER_FROM = {
  repo: "arminazimi/seaworthy",
  issues: {
    "spike.md-twin-liquid": 38,
    "spike.persian-type": 39,
    "E-theme-tokens": 17,
    "theme.tokens": 132,
    "theme.dark": 133,
    "theme.config": 134,
    "theme.signature": 135,
    "theme.tokens-docs": 136,
    "E-theme-layouts": 18,
    "theme.base": 137,
    "theme.home": 138,
    "theme.doc": 139,
    "theme.post": 140,
    "theme.page": 141,
    "theme.code": 142,
    "theme.logical-css": 143,
    "theme.i18n": 144,
    "theme.persian": 145,
    "theme.search": 146,
    "E-theme-ai": 19,
    "theme.llms-txt": 147,
    "theme.md-twin": 148,
    "theme.jsonld": 149,
    "theme.copy-button": 150,
    "theme.action": 151,
    "launch2.template": 152,
    "launch2.directories": 153,
    "launch2.visual-tests": 154,
    "ext.presets": 164
  },
};
