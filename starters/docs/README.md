# Starter files

Files every new Slipway site copies as they are: everything here except this README.

A documentation sample with versioned navigation: `v2/` is the current guide and `v1/` is legacy, and the sidebar in `_data/navigation.yml` lists both versions as groups, so the version bar is the navigation itself. Every version covers the same three pages (overview, install, commands), and the legacy pages open with a note that points at the current guide.

| File | What it is for |
| --- | --- |
| `AGENTS.md` | What an agent reads before it edits the site: where content lives, the schemas, how to add a page to both versions, how to add a version, how to keep the sidebar honest. |
| `.vscode/settings.json` | Maps `_config.yml` and `_data/navigation.yml` to their JSON Schemas for autocomplete ([docs/editor.md](../../docs/editor.md)). |
