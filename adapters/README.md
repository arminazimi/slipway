# Generator adapters

The adapters in this folder make existing static site generators produce what the [agent-editable site spec](../spec/agent-editable/0.1.md) asks for, so an agent can edit a site without the site moving to Slipway. Each adapter writes `sourcemap.json`, a Markdown twin of every content page, and `data-source` on headings, and ships a `starter/` folder for the site to copy. The full list and the rules for adding one are in [spec/adapters.md](../spec/adapters.md).

## Status: frozen until the standard phase

The adapters are frozen for the 0.3.0 release. They stay in the repository and keep their tests, which still build each fixture site and run `slipway doctor` on it. No new features land in them during 0.3.0. Work on them resumes after 0.3.0, when the agent-editable standard phase begins (see [ROADMAP.md](../ROADMAP.md) and [ADR 0021](../docs/adr/0021-docs-first.md)).
