# 0028. Derived site facts: a model-stage data channel

**Status:** Accepted (2026-11-10).

## Context

Outputs run after pages are rendered, so a value an output computes — an examples list, a drift report, trust levels, versions, reading time — arrives too late for a layout or component to read while it renders. The only channel a theme can read during render is `Site.data`, and until now it holds only what the site wrote in `_data/`.

Some of that data is not authored by the site. It is a fact about the site: which examples exist, which pages drift, how long a page takes to read. A site can write it in `_data/` by hand, but then it goes stale the moment a page changes. The engine should be able to derive it from the finished model and let a site override it when it wants to.

The change must not alter a frozen contract or make every feature edit the same shared file. `Site.data` is already `Readonly<Record<string, unknown>>` ([ADR 0022](0022-engine.md), rule 2), so it can carry derived values without a contract change.

## Decision

1. **Facts are computed at the end of the model stage.** After discovery, front matter, Markdown, the pages, navigation, and `_data` are final, `buildModel()` runs every fact and merges its value into the site model. Render and outputs see the enriched `Site`; nothing else in the pipeline changes order. The site model is the last stage that can still see every page, the config, and the source tree together.
2. **One file per fact.** A fact lives at `packages/engine/src/model/facts/<name>.ts` and exports `{ name, compute }`: `name` is the key in `Site.data` and must equal the file name without `.ts`; `compute(ctx)` receives `{ root, sourceDir, config, pages, data }` and returns a value or a promise of one. `loadFacts(dir?)` finds the files by listing the folder in file-name order (code points) and imports them; a bad unit is a diagnostic, never a throw. This follows the folder-per-unit rule of [ADR 0023](0023-engine-theme-boundary.md), rule 2: adding a fact never edits a shared index, the pipeline, or another fact. The `dir` option exists so tests can point at a temporary folder.
3. **A site's `_data` wins.** If `data[name]` already exists, the fact does not run, its value is not stored, and no diagnostic is reported. `_data/<name>.yml` is the site's source of truth; a fact is the engine's fallback for a site that has not written the value itself. Precedence is silent because an override is an ordinary choice, not a problem.
4. **A broken fact is visible and local.** A unit that cannot be imported, exports no fact, exports more than one, or whose `name` differs from its file name is a `facts.load-failed` error and is skipped. A fact that throws or returns `undefined` is a `facts.compute-failed` warning and is skipped, and every other fact still runs. A malformed unit is a defect in the engine's own source and fails the build; a failed computation is reported but does not stop a site from building, because one derived value must not take the whole site down. Neither case is silent.
5. **Determinism.** Facts run in file-name order. The merged `Site.data` is rebuilt with its keys sorted by code point, so the same input gives the same data and the same key order (ADR 0022, rule 5). A fact must not read the clock, the environment, or a random source; it derives its value from the context it receives.
6. **A fact is not a second config file.** A value a site may choose belongs in `mizzen.yml` ([ADR 0024](0024-site-config.md)) or in `_data/` when it is data. A fact exists only for a value the engine can derive from the site. `mizzen.config.ts` stays code only for plugins; facts are engine code, not site code, and are not loaded from the site.

## Consequences

- Themes and outputs read derived values from `Site.data` during render; no output has to run earlier and no contract type changes.
- Each new derived value is one file and one test; feature tasks add facts without touching each other, and a site can always override one by writing `_data/<name>.yml`.
- A failing fact leaves a hole in `Site.data` rather than a wrong value. The warning names the file, and a page that needs the value fails loudly if it dereferences nothing.
- `applyFacts` and `loadFacts` are the only entry points. `buildModel()` calls `applyFacts` itself, so the programmatic API, the CLI, and the tests all see the same data.
