# Upgrading

This document lists changes in each minor release that require you to update your site's files when you upgrade.

## 0.2.0

No change is required. A site built on 0.1.0 builds on 0.2.0 with the same `_config.yml`, front matter, and overrides, and no config key or front matter field was renamed (`schema/deprecations.json` is empty).

Two behaviors changed in ways you may notice:

- **One `h1` per page.** A page whose content starts with its own `#` heading no longer gets a second `h1` from the `doc` and `page` layouts, and a page without a `title` takes it from its first heading. If your CSS targeted the duplicate heading, remove that rule.
- **Search index.** Entries now keep the title, URL, headings, and a 300-character excerpt, and the index loads when the search field is first used. Add `search: false` to a page to leave it out. A site that copied `search.json` before 0.2.0 should copy the new one from `starter-files/`.

To pin this release, set `remote_theme: arminazimi/slipway@v0.2.0`.
