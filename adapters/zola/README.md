# Slipway adapter for Zola

A script that makes a Zola site [agent-editable](../../spec/agent-editable/0.1.md) up to level L2. It writes:

- `/sourcemap.json` ([format v0](../../spec/sourcemap/v0.md)): every page with a source file, its headings, and its inline links, each at its line in the source file, front matter included.
- a Markdown twin of every page at `<page>/index.md`: the title as a heading, then the page's Markdown as written, without front matter.

`AGENTS.md` and the content schemas live in the site's source folder, which a module cannot write, so the module ships them in [`starter/`](starter/) for the site to copy: `AGENTS.md`, `content-schemas.json`, and `schema/` with schemas for `config.toml` and for front matter. Edit them to match the site; `slipway doctor` checks they stay true.
