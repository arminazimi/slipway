# 0003. The content model is the Jekyll file layout, limited to a subset other frameworks can read in place

**Status:** Accepted (2026-10-18)

## Context

Slipway starts on Jekyll because a fork of a Jekyll template is a live site on GitHub Pages with no build step. The roadmap also promises that content and config do not depend on Jekyll, so an Astro adapter can follow (principle 6; task `ext.astro-design`). Issue #51 asks what that neutral model is: front matter, collections, navigation.

The tempting answer is a new, framework-independent format with a generator for each framework. That fails the first requirement: classic GitHub Pages runs no generator, so the files in the repository must already be what Jekyll reads.

## Method

Built a throwaway Astro 7.4.0 project in which the content stayed in Jekyll's layout and Jekyll's conventions: two documents in `_docs/` (one in Persian with `dir: rtl`), a post in `_posts/` named `2026-10-18-hello-world.md`, a `_data/navigation.yml`, and a `_config.yml`. An Astro content config pointed `glob()` loaders at `./_docs` and `./_posts`. Then built it and read the output. Facts about Jekyll come from its documentation; Jekyll itself was not run here (the machine's Ruby is 2.6, too old). Jekyll behavior is verified in CI by the first layout task (`foundation.layout`).

## Results

| Question | Result |
| --- | --- |
| Can Astro read `_docs/` and `_posts/` in place? | Yes. `glob({ base: "./_docs" })` reads the folders; 3 pages built in 0.9 s |
| Do Jekyll-only front matter keys (`layout`, `permalink`) break a schema? | No, with `.passthrough()`; they stay in `entry.data` |
| Persian text and `dir: rtl` | Both pass through; the page got `lang="fa" dir="rtl"` |
| Post date and slug | Not in the front matter. Jekyll takes them from the file name; Astro's `id` is the whole name (`2026-10-18-hello-world`), so an adapter has to split it |
| `_data/navigation.yml` | Read unchanged with the `yaml` package. A direct import did not give a result in the test. Astro's `file()` loader wants an `id` on every entry, which a nested navigation list does not have |
| Liquid inside content | Jekyll renders Liquid in Markdown bodies by default; Astro does not. Content that contains `{{ }}` or `{% %}` is not portable |

## Decision

The model is a small, written subset of what Jekyll already reads. Nothing is generated; an adapter reads the same files.

1. **Collections are folders named `_<collection>/`** (for example `_docs/`, `_posts/`, `_pages/`), declared in `_config.yml` under `collections:` with `output: true`. Posts keep Jekyll's `YYYY-MM-DD-slug.md` naming, and the neutral rule for date and slug is that file-name rule.
2. **Front matter is YAML with a documented set of keys**, defined as a JSON Schema in `schema/front-matter.schema.json` (task `schema.front-matter`): `title` (required), `description`, `lang`, `dir`, `date`, `tags`, `nav_order`, `layout`, `permalink`, and `published`. Unknown keys are kept and ignored, never rejected.
3. **Navigation is `_data/navigation.yml`**: a list of `title`, `url`, and optional `children`, validated by schema. Per-language UI strings are `_data/i18n/<lang>.yml`.
4. **Site settings are `_config.yml`**, with Slipway's own settings under a `slipway:` key (design tokens, feature switches).
5. **Bodies are CommonMark and raw HTML only: no Liquid.** Anything dynamic belongs in layouts and includes, not in content. Where Jekyll would still process Liquid in a body, the docs show how to escape it (and `render_with_liquid: false` where Jekyll 4 is available; classic GitHub Pages may not have it, to be confirmed in `foundation.modes`).
6. **Layouts, includes, and CSS are Jekyll-specific by design.** The Astro adapter provides its own components that read the same collections, navigation, and tokens. Sharing the content model is the promise; sharing templates is not.
7. **Slipway checks the subset.** A schema test runs over every starter, so a content file that stops being portable fails CI.

## Consequences

- Authors never see a neutral format. They write Jekyll files; the neutral model is the rules about which parts of Jekyll they may use.
- An Astro adapter needs three small pieces: loaders pointing at the underscore folders, a rule that splits `YYYY-MM-DD-slug` file names, and a YAML reader for `_data`. The test project did the first and third in about 40 lines.
- Liquid in content is the main trap, and the schema cannot catch it; a Seaworthy-style check of the built output cannot either. Slipway needs its own lint for `{{`, `{%` in Markdown bodies (task to add under `E-schemas`).
- Not covered here: Jekyll's `permalink` rules, collection-level `defaults` in `_config.yml`, and how Astro would take over redirects. Each needs a test when the adapter is designed.
