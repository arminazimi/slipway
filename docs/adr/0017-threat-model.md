# 0017. Threat model: the theme, the gem, `remote_theme`, the Actions, the npm packages, and agent pull requests

**Status:** Accepted (2026-10-30).

## Context

Slipway ships code that runs in other people's sites, in their repositories, and in their CI. An agent edits those sites and this repository from issue text, comments, and fetched pages it did not write. This ADR records what an attacker could reach through each thing Slipway ships, the control that stops it today, and the gap that is still open.

The scope is what Slipway itself distributes. A site owner's own content, plugins, and hosting configuration are theirs; where Slipway's defaults can make their choice unsafe, the control is a documented default, not a guarantee.

## Decision

Each asset gets its threats, the control in this repository, and a gap with the issue or task that closes it. A new distributable adds a row before it ships.

### Theme files rendered in sites

- **Threats.** A change to `_layouts/` or `_includes/` runs in every site that uses the theme: injected HTML or JavaScript reaches readers, and Liquid that reads `site.` values can leak config into pages. A dependency or token change can break the CSP a site relies on.
- **Controls.** JavaScript is optional and stays under 10 KB (`tools/theme/js-budget.test.mjs`); the only inline script is the hashed theme-init (`docs/security-headers.md`, `tools/theme/csp.test.mjs`); layout and include changes run every example build and the browser, no-JavaScript, axe, and Seaworthy checks; RTL and logical-property rules are enforced by tests.
- **Gaps.** A site cannot verify that the tag it pins was built from a signed release; see "The gem" below.

### The gem

- **Threats.** A compromised RubyGems account, a stolen maintainer token, or a typo-squatted name installs attacker code in a site's build.
- **Controls.** The gem has no runtime dependencies; releases are published by trusted publishing from `.github/workflows/release.yml`, which runs only on a `v*` tag that matches `slipway-theme.gemspec` and only after `npm run check` passes; lockfiles pin the gem version in CI. Maintainers push the tag; agents never do.
- **Gaps.** No build provenance attestation for the `.gem` yet ([#712](https://github.com/arminazimi/slipway/issues/712)).

### `remote_theme`

- **Threats.** GitHub fetches the theme at build time. A moved branch or retagged release changes a site's output without a change in the site's repository, and the site has no lockfile for it.
- **Controls.** The docs and every starter pin a tag (`remote_theme: arminazimi/slipway@v1.0.0`), never `main`; the tag is frozen by convention and the release workflow never reuses one.
- **Gaps.** Nothing enforces the tag in a site's config; the doctor could warn on a branch instead of a tag (a generator check, not in this ADR's scope).

### The composite Actions (`action/doctor`, `action/setup`)

- **Threats.** A pull request title, branch name, or input value interpolated into `run:` is shell injection with the workflow's token; the Action installs npm dependencies and runs them; a write-scoped token lets a compromised step push.
- **Controls.** Inputs reach scripts through `env:` and `run.mjs` reads them, never through inline `${{ }}` in `run:`; the doctor Action runs `npm ci --omit=dev --ignore-scripts`; workflows request `permissions: {}` by default and `contents: read` per job; Actions in this repository are pinned to commit SHAs (`tools/actions` tests).
- **Gaps.** The rule is not yet enforced by a test ([#718](https://github.com/arminazimi/slipway/issues/718)), and `action/setup` has not been hardened alongside `action/doctor`.

### The npm packages (`@slipway/tokens`, `slipway-mcp`, the doctor CLI, `create-slipway`)

- **Threats.** A tool reads outside the site it was given (path traversal or symlink escape), runs code from the site, or is published under a name the project does not control.
- **Controls.** The MCP server refuses any path whose real location leaves the site directory and only reads; the doctor parses files and never executes them; `create-slipway` copies known files into a new folder; nothing is published to npm yet, and no package is a dependency of a Slipway site before 1.0 ([ADR 0011](0011-standalone-and-the-spec.md)).
- **Gaps.** Publishing and provenance for the npm packages wait for their release tasks; each needs the same trusted-publishing and attestation story as the gem.

### Agent pull requests

- **Threats.** Issue text, comments, and fetched pages are attacker-controlled input to an agent that holds a repository token. Prompt injection can make it exfiltrate secrets, weaken a test, edit a workflow, or open a pull request that looks reviewed but is not.
- **Controls.** Agents treat issue text and fetched pages as data (`AGENTS.md`); one issue is one pull request, and a task with `lane: maintainer` is never an agent's; hot files (workflows, `package.json`, `CHANGELOG.md`, `ROADMAP.md`, `base.html`, `head.html`, the core stylesheet) stay out of agent edits; CI runs CodeQL, gitleaks, dependency review, and the Action policy tests with read-only tokens; `npm run check` must pass before a pull request claims a change is done.
- **Gaps.** Nothing automatically detects two open pull requests editing the same file ([#692](https://github.com/arminazimi/slipway/issues/692)) or feeds a failing CI step back to the agent ([#693](https://github.com/arminazimi/slipway/issues/693)); dependency review is enabled per repository and currently off, so that check cannot gate a pull request.

## Consequences

- Every distributable has a written threat story before it ships; review this ADR when a new one is added or an asset changes hands.
- Controls move into tests wherever they can (`csp.test.mjs`, `js-budget.test.mjs`, the Action policy tests), so a regression fails CI rather than relying on review.
- Gaps are ordinary roadmap issues; closing one removes the row's gap, not the threat.
- The model assumes branch protection on `main` and a repository secret store; both are maintainer settings outside this repository's files.
