# 0012. The public API under semver, and how it is deprecated

**Status:** Accepted (2026-10-25). Applies from `0.2.0`.

## Context

[ADR 0011](0011-standalone-and-the-spec.md) promises that `1.0.0` comes with a semver contract: a site that builds on one release keeps building, and looking the same, on every later release with the same major version. That promise needs a written list of what a site may rely on. Without one, every file in `_layouts/` and `_includes/` and every CSS rule is implicitly public, and the theme cannot change its insides.

Sites pin a version with `remote_theme: arminazimi/slipway@vX.Y.Z` or the `slipway-theme` gem (`standalone.release`), so the list below is what a version number makes promises about.

## Decision

1. **Public is what is listed here.** Everything else (class names, internal includes, Liquid variables starting with `sl_`, file paths under `assets/` other than the ones listed, the HTML structure of a layout, and the format of `search.json`) is internal and may change in any release.
2. **Only tested items are public.** An item without a test that would fail if it broke is listed as *not yet tested*: it is public in intent, and a follow-up adds the test before `1.0.0`.
3. **What each release may change:**

   | Release | May change in the public API |
   | --- | --- |
   | Patch (`1.2.3` → `1.2.4`) | Nothing. Fixes only, including fixes that make output match this ADR. |
   | Minor (`1.2` → `1.3`) | Add items. Deprecate items: the old name keeps working and warns. |
   | Major (`1.x` → `2.0`) | Remove items deprecated in an earlier minor release. Change defaults. |

   Before `1.0.0` the same table applies one place down: `0.MINOR` acts as major and `0.x.PATCH` as minor. So `0.3.0` may remove an item deprecated in `0.2.x`, and `0.2.1` may only add and deprecate.

4. **Deprecation.** A deprecated item keeps working for at least one minor release (one `0.x.y` patch release before 1.0) and warns at build time with its replacement (`standalone.deprecations`). Every deprecation and removal is listed in `CHANGELOG.md` and, with the exact edit a site needs, in `UPGRADING.md` (`standalone.upgrade-test`).

   Example: `1.3.0` renames `slipway.tokens.radius` to `slipway.tokens.radius_card`. In `1.3.0` both keys work, the new one wins when both are set, and the build prints `_config.yml:14 slipway.tokens.radius is deprecated since 1.3.0, use slipway.tokens.radius_card`. The old key is removed no earlier than `2.0.0`.

5. **Visual changes are not breaking.** A new default colour, spacing, or font within the same tokens is a minor change. Removing or renaming a token is not.

## The public surface

### Config keys (`_config.yml`)

The `slipway` block, described by [`schema/slipway-config.schema.json`](../../schema/slipway-config.schema.json):

| Key | Public | Tested by |
| --- | --- | --- |
| `slipway.languages` (`code`, `name`, `prefix`) | yes | `i18n.test.mjs`, `config.test.mjs` |
| `slipway.persian.digits` | yes | `persian.test.mjs` |
| `slipway.persian.jalali` | yes | `persian.test.mjs` |
| `slipway.tokens.accent` | yes | `config.test.mjs` |
| `slipway.tokens.canvas` | yes | `config.test.mjs` |
| `slipway.tokens.text` | yes | `config.test.mjs` |
| `slipway.tokens.font_display` | yes | `config.test.mjs` |
| `slipway.tokens.font_body` | yes | `config.test.mjs` |
| `slipway.tokens.radius` | yes | `config.test.mjs` |

Jekyll keys the theme reads: `title` and `lang` are public (every layout test). `direction` is public (`not-found.test.mjs`). `author` (feed author name, a string or `name`) is public (`config.test.mjs`). `url` and `baseurl` are read through Jekyll's `absolute_url` and `relative_url`; they stay Jekyll's. The schema describes all six, and `config.test.mjs` fails when a layout reads a `site.*` key the schema lacks.

### Data files

| File | Public | Tested by |
| --- | --- | --- |
| `_data/navigation.yml`: `main`, `docs`, and `main_<lang>`, `docs_<lang>` | yes | `navigation.test.mjs`, `doc-layout.test.mjs` |
| `_data/i18n/<lang>.yml`: the keys of `_includes/i18n-builtin.html` | yes | `i18n.test.mjs` |

### Front matter

| Field | Layouts | Public | Tested by |
| --- | --- | --- | --- |
| `layout`, `title`, `description` | all | yes | every layout test |
| `lang`, `direction` | all | yes | `i18n.test.mjs`, `not-found.test.mjs` |
| `translation_key` | all | yes | `i18n.test.mjs` |
| `permalink` | all (Jekyll's) | yes | `doc-layout.test.mjs` |
| `date`, `tags`, `categories` | `post` | yes | `post-layout.test.mjs`, `taxonomy.test.mjs` |
| `cta_text`, `cta_url` | `home` | yes | `home-layout.test.mjs` |
| `sitemap: false` | all | yes, *not yet tested* | |
| `search: false` | all | yes, *not yet tested* | |

Collections and their schemas are added by `schema.front-matter`; this table grows with it.

### Layouts

| Layout | Public | Tested by |
| --- | --- | --- |
| `default`, `page` | yes | `base-layout.test.mjs`, `page-layout.test.mjs` |
| `home` | yes | `home-layout.test.mjs` |
| `doc` | yes | `doc-layout.test.mjs` |
| `post` | yes | `post-layout.test.mjs` |
| `archive`, `tags` | yes | `taxonomy.test.mjs` |
| `not-found` | yes | `not-found.test.mjs` |
| `feed`, `sitemap` | yes | `feed.test.mjs` |
| `search-index` | yes | `search.test.mjs` |
| `base` | no: the parent of the others; use `default` | |

### Includes

Includes are internal, so the theme can restructure its markup. One is public, because custom layouts need translated text:

| Include | Parameters | Public | Tested by |
| --- | --- | --- | --- |
| `t.html` | `key` (required), `lang` (defaults to the page's) | yes | `i18n.test.mjs` |
| `head-custom.html` | none: an override slot, empty in the theme, rendered at the end of `<head>` | yes | `overrides.test.mjs` |
| `footer-custom.html` | none: an override slot, empty in the theme, rendered at the end of `<footer>` | yes | `overrides.test.mjs` |

The third override slot is the path `assets/css/custom.css`: when a site has that file, every page links it after the theme styles (`overrides.test.mjs`). The slots are documented in [docs/overrides.md](../overrides.md). Shadowing any other include works but is unsupported: it may break in a minor release.

### CSS custom properties

Every custom property in `assets/css/tokens.css`, generated from [`tokens/theme.tokens.json`](../../tokens/theme.tokens.json) and documented in [docs/tokens.md](../tokens.md), is public (`tokens.test.mjs`, `tokens-docs.test.mjs`). Primitive palette values in the JSON file are internal: they have no CSS name, and semantic tokens may point at other primitives.

| Group | Properties |
| --- | --- |
| Color | `--sl-color-canvas`, `--sl-color-surface`, `--sl-color-text`, `--sl-color-heading`, `--sl-color-muted`, `--sl-color-line`, `--sl-color-rose`, `--sl-color-rose-hover`, `--sl-color-rose-fill`, `--sl-color-on-rose-fill` |
| Fonts | `--sl-font-display`, `--sl-font-body`, `--sl-font-ui`, `--sl-font-mono`, `--sl-font-persian` |
| Type scale | `--sl-step-sm`, `--sl-step-base`, `--sl-step-lg`, `--sl-step-xl`, `--sl-step-2xl`, `--sl-step-3xl` |
| Spacing | `--sl-space-1`, `--sl-space-2`, `--sl-space-3`, `--sl-space-4`, `--sl-space-6`, `--sl-space-8`, `--sl-space-12`, `--sl-space-16` |
| Radius | `--sl-radius-card`, `--sl-radius-compact` |
| Measure and rule | `--sl-measure`, `--sl-rule` |
| Button | `--sl-button-bg`, `--sl-button-fg`, `--sl-button-radius` |

### Generated URLs

| URL | Public | Tested by |
| --- | --- | --- |
| `/feed.xml` | yes | `feed.test.mjs` |
| `/sitemap.xml` | yes | `feed.test.mjs` |
| `/search.json` (the URL, not its format) | yes | `search.test.mjs` |
| `/404.html` | yes | `not-found.test.mjs` |
| Language homes at each `prefix` of `slipway.languages` | yes | `i18n.test.mjs` |

`tools/theme/public-api.test.mjs` fails when a key in the config schema or a custom property in `tokens.css` is missing from this ADR, so the list cannot fall behind silently.

## Consequences

- Class names, include files, and markup can be refactored freely; a site that styles `.sl-*` classes or shadows an internal include does so at its own risk, and [docs/overrides.md](../overrides.md) says so.
- Adding a config key, front-matter field, layout, or token means adding a row here in the same pull request.
- Items marked *not yet tested* get tests before `1.0.0` (the `1.0 readiness review` task checks this).
- `standalone.deprecations` and `standalone.upgrade-test` implement rule 4.
