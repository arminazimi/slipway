// Tasks already finished before their issues existed. apply.mjs creates these issues and closes them with a note.
export const DONE = {
  "cleanup.starters": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
  "cleanup.examples": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
  "cleanup.marketing-blocks": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
  "cleanup.blog-layouts": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
  "cleanup.jekyll-theme": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
  "cleanup.jekyll-plugins": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
  "cleanup.ruby": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
  "cleanup.jekyll-tests": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
  "cleanup.jekyll-gates": "Done in one pull request that removed Ruby and Jekyll from the repository (2026-11-09). The legacy Jekyll sites that doctor and mcp test against moved to packages/doctor/test/fixtures/examples/.",
};

/**
 * Issues that already exist in another repository and should be transferred here with `gh issue transfer`,
 * which keeps their history, instead of creating new ones. Keys match ROADMAP.md.
 */
export const TRANSFER_FROM = {
  repo: "arminazimi/seaworthy",
  issues: {},
};
