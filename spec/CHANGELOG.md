# Spec changelog

Changes to the specs in this folder, newest first. Each entry names the spec and version and links the RFC that made the change ([PROCESS.md](PROCESS.md)). Editorial fixes are listed under "Editorial".

## Agent-editable site

### 0.1 (Draft, 2026-10-25)

- First draft: requirements for `AGENTS.md`, the page-to-file map, content schemas, section-to-line maps, edit prompts, and the agent-skills index (#177).
- Conformance levels L0 to L3 and the machine-readable `tests.json` (#178).
- The checker report format, `report.schema.json`: each finding has the test `id`, `severity`, and the file and line, moved to the source file through the source map when it was found on a built page (#185).

## Source map

### 0 (Draft, 2026-10-25)

- First draft: the `sourcemap.json` format and its schema (#66).
