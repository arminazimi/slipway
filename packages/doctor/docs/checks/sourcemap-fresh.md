# `doctor.sourcemap-fresh`

A committed source map (`sourcemap.json`, [spec/sourcemap/v0.md](../../../../spec/sourcemap/v0.md),
level 1) records the line of every heading. When a page is edited above a heading, the recorded line
starts pointing at something else. This check compares each section's recorded line with the heading
that carries the same text in the current Markdown source, and reports every section that moved or no
longer exists. It is a warning: it never changes the level the site reaches, and every finding names
the source file and line.

A `sourcemap.json` that is a level 0 page with front matter is skipped: there are no lines to compare
until the generator builds the map.

## Why it matters for agents

Agents use the source map to turn a finding on a built page into the file and line they should edit.
A stale line sends the agent to an unrelated paragraph, so it edits the wrong place or reports that
the heading it was sent to does not exist. The edit looks plausible, and the page keeps drifting.

## How to fix

Regenerate the map from the current sources and commit it. In Slipway:

```bash
npm run sourcemap -- <site>
```

Other generators write the map during the build; rebuild and commit their output.

## Examples

**Bad:** a paragraph was added after `# Install`, so the map still says line 2 but the heading is now
at line 5.

```json
{ "id": "install", "level": 1, "line": 2, "text": "Install" }
```

**Good:** the map's line matches the heading's current line.

```json
{ "id": "install", "level": 1, "line": 5, "text": "Install" }
```
