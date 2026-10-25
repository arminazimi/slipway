# Specs

Contracts that Slipway publishes for any generator, theme, or tool to implement. Slipway's theme is the reference implementation of each.

| Spec | Version | Status | Schema |
| --- | --- | --- | --- |
| [Agent-editable site](agent-editable/0.1.md): what a site publishes so an agent can edit it safely | 0.1 | Draft | [`content-schemas.schema.json`](../schema/content-schemas.schema.json) |
| [Source map](sourcemap/v0.md): which source file and line produced each built page, heading, and link | 0 | Draft | [`sourcemap.schema.json`](../schema/sourcemap.schema.json) |

Drafts may change without notice until Spec 1.0 (`spec.theme` in [ROADMAP.md](../ROADMAP.md)). Requirement ids such as `ae.agents-md.present` are never reused for a different meaning.

Each spec says what must exist and how to check it, with no network access by default. Requirements in a spec's normative text never depend on one generator; generator-specific notes appear only in examples. The checker is `slipway doctor` (planned, `doctor.cli`). Questions of site health and agent readability, such as broken links or `llms.txt`, belong to Seaworthy, not to these specs ([ADR 0011](../docs/adr/0011-standalone-and-the-spec.md)).
