// Tasks already finished before their issues existed. apply.mjs creates these issues and closes them with a note.
export const DONE = {};

/**
 * Issues that already exist in another repository and should be transferred here with `gh issue transfer`,
 * which keeps their history, instead of creating new ones. Keys match ROADMAP.md.
 */
export const TRANSFER_FROM = {
  repo: "arminazimi/seaworthy",
  issues: {},
};
