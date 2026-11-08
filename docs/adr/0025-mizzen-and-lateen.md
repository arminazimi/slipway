# 0025. The engine is Mizzen and the theme is Lateen; they leave this repository after 0.3.0

**Status:** Accepted (2026-11-08). Amends [ADR 0021](0021-docs-first.md) (product names, `create-slipway`), [ADR 0023](0023-engine-theme-boundary.md) (rule 4, the one product name in the engine) and [ADR 0024](0024-site-config.md) (config file names, default theme).

## Context

ADR 0021 made the engine and the theme two products in one repository, and ADR 0023 drew the boundary between them. Both still carry the name Slipway: the packages are `@slipway/engine` and `@slipway/theme`, the command is `slipway build`, and the config is `slipway.yml`. The projects are moving to the Velella organization (github.com/velella-sh), where every product has its own name and every package is published as `@velella/<name>`. Nothing from 0.3 is published yet, so a rename costs only edits now and costs users later.

## Decision

1. **Names.** The engine is **Mizzen** and the theme is **Lateen**. "Slipway" is no longer a product name.

   | Today | From now on |
   | --- | --- |
   | `@slipway/engine` | `@velella/mizzen` (Apache-2.0) |
   | `@slipway/theme` | `@velella/lateen` (MIT) |
   | `slipway build` | `mizzen build` |
   | `slipway.yml` | `mizzen.yml` |
   | `slipway.config.ts` | `mizzen.config.ts` |
   | default theme `@slipway/theme` | `@velella/lateen` |
   | `create-slipway` | `npm create @velella/lateen` (package `@velella/create-lateen`) |

2. **The engine may contain its own name, never the theme's.** ADR 0023 rule 4 becomes: the engine source contains no Lateen name, color or layout; `mizzen.yml` and `mizzen.config.ts` are the engine's own names and need no exception. `quality.boundary` checks for `lateen`, not `slipway`.
3. **One repository until 0.3.0 is done.** All 0.3.0 tasks stay here so engine and theme change together and are tested together. Meanwhile:
   - each package is self-contained (`README`, `LICENSE`, `CHANGELOG`, `tsconfig`, tests) and does not depend on root `tools/`;
   - the theme imports contracts by package name (`@velella/mizzen/contracts`), never by relative path;
   - releases are tagged `mizzen-v*` and `lateen-v*`, with a changelog per package;
   - every issue has `area:engine` or `area:theme`.
4. **The split.** When all 0.3.0 tasks are done and each package is tested on its own: `arminazimi/mizzen` and `arminazimi/lateen` are created with `git filter-repo` (file history kept, old tags not carried over), open issues are transferred by their `area:` label, both repositories are transferred to `velella-sh`, and each is tagged `v0.1.0`, Mizzen first. This repository is then archived, not deleted; `v0.2.0` and the `legacy/jekyll` branch stay usable.
5. **Licenses.** Mizzen is Apache-2.0, like the other Velella tools. Lateen stays MIT, because theme code is copied into users' sites.

## Consequences

- The 0.3.0 tasks that create files, commands or config use the new names; tasks already written with `slipway.yml` or `@slipway/*` are read with the table above.
- The migration tool (`evergreen.migrate-config`) writes `mizzen.yml`.
- Evergreen's docs stay on `v0.2.0` until Mizzen and Lateen are tagged `v0.1.0`.
- The brand files (logo, favicon, social preview) change on the day of the split, not before.
- Mizzen's license change from MIT to Apache-2.0 assumes no outside contributor holds copyright in the engine code; this is checked before the split.
