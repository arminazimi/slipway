# CLAUDE.md

Read [AGENTS.md](AGENTS.md) first: it holds the commands, layout, boundary rules, contracts, and generated files for this repository.

- Run `npm run check` before you say a change is done.
- One issue = one pull request. Touch only the files the issue lists.
- The engine (`packages/engine`) never imports from the theme (`packages/theme`); the theme imports only `import type` from `@velella/mizzen/contracts`.
- `packages/engine/src/contracts/` and the other frozen contracts change only through an ADR.
- `ROADMAP.md` is the source of truth for planned work; `planning/roadmap/out/` is generated.
