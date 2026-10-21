# 0010. UI strings are built in with site overrides; languages live in URL folders

**Status:** Accepted (2026-10-22)

## Context

Task #17 needs translated UI text, a text direction that follows the language, and a language switcher. Jekyll does not load `_data` from a theme gem or from `remote_theme`, so a theme cannot ship its strings as data files and expect them to be read in all three modes (gem, template, remote).

## Decision

1. **Built-in strings** for `en` and `fa` live in `_includes/i18n-builtin.html`. Every layout reads text through `{% include t.html key="..." %}`.
2. **Sites override or add languages** in `_data/i18n/<lang>.yml`; keys left out fall back to the built-in ones (English for unknown languages).
3. **Direction follows `lang`**: right-to-left for `fa`, `ar`, `he`, `ur`, `ps`, `ku`, `sd`, `yi`, `dv`, `ug`. `direction` in front matter or `_config.yml` still wins.
4. **Languages are URL folders** (`/fa/…`) with `lang` in front matter. `slipway.languages` in `_config.yml` lists them and drives the switcher. Pages that translate each other share `translation_key`.
5. **The switcher is plain links**: the translation if one exists, otherwise the language home. No JavaScript.
6. Scripts read their labels from `data-*` attributes the layouts print, so strings stay in one place.

## Consequences

- A new built-in language means editing the include; a site language means one YAML file.
- The `translation_key` lookup scans pages and documents at build time; fine for small sites, to be revisited if builds slow down.
