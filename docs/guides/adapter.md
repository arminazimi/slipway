# Guide: Make Any Generator Conform to the Spec

The [Agent-Editable Site Specification](../../spec/agent-editable/0.1.md) defines what a static site needs to publish so an AI agent can read and edit it safely. It spans four conformance levels (L0 to L3). Any static site generator can implement this spec.

You can check your site's conformance at any time using `npx slipway doctor <dir>`.

This guide walks through how to make an adapter or site conform to the spec, level by level.

## Level L0: Instructions and a page-to-file map

At Level 0, an agent can find the source file behind any built page and read the rules for editing it.

1. **Add `AGENTS.md`**: Create a file named `AGENTS.md` at the root of your source folder. It must be UTF-8 encoded Markdown with at least one non-blank line.
   * **Name the folders**: It must contain code spans naming at least one folder or file where content lives, and the output folder that agents must not edit (e.g., `_posts` and `_site/`).
   * **Paths must exist**: Every relative path named in a code span must exist in the source folder (except the output folder and paths with `<slug>` placeholders).
   * **Best practices (SHOULD)**: Include a section starting with "Never" or "Do not" listing edits that break the site. Keep the file under 32 KiB so it doesn't crowd out the agent's context window.

2. **Add a Source Map**: The build output must contain a `/sourcemap.json` at its root.
   * **Format**: It must follow the `schema/sourcemap.schema.json` schema. At L0, each entry only needs a `url` and a `source`.
   * **Paths must resolve**: Every `source` must exist in the source folder, and every `url` must resolve to a file in the output folder.

3. **Right-to-Left Text (SHOULD)**: If your site has RTL content:
   * **Set `dir`**: The root `<html>` element should have `dir="rtl"` when the `lang` is a right-to-left language (e.g., `ar`, `fa`, `he`).
   * **Isolate bidi text**: The page title, `h1` elements, and links inside `nav` elements should isolate runs of mixed-direction text (using `<bdi>`, a `dir` attribute, or isolate marks like U+2066).

## Level L1: Content schemas

At Level 1, an agent can validate its edits before saving, knowing exactly which fields are accepted by front matter and configuration files.

1. **Add `content-schemas.json`**: Place this file at the root of your source folder. It maps files to JSON Schemas (draft 2020-12).
   * **Format**: It must have `version: "0.1"` and an array of `schemas`. Each schema entry maps `files` (globs) to a `schema` URL or path, targeting either `"front-matter"` or the entire `"file"`.
   * **Valid references**: Every `schema` path must resolve to a valid JSON Schema document.
   * **Schema assignment**: Every configuration file the generator reads must match a `"file"` target entry. Every content file mapped in `sourcemap.json` that has front matter must match at least one `"front-matter"` entry.
   * **Validation**: Every matched file must be valid against its schema.

2. **Update `AGENTS.md`**:
   * Include the code span `content-schemas.json` to tell agents where to find the index.
   * **Best practice (SHOULD)**: Add a command that checks the site after an edit in a fenced code block marked `sh`, `bash`, or `shell`.

3. **Source map coverage (SHOULD)**: Every content file matched by a `"front-matter"` schema entry should appear in `/sourcemap.json`, unless the generator intentionally does not publish it.

## Level L2: Section-to-line maps and edit prompts

At Level 2, an agent can edit the exact line a user points at from a built page.

1. **Upgrade `/sourcemap.json`**: Every page in the map must now include `sections` and `links`.
   * **Exact lines**: Every `line` referenced must exist in its source file and contain the text or link specified.
   * **Matching IDs**: Every section `id` in the map must match the `id` of an `h1` through `h6` heading on the built HTML page.

2. **Add `data-source` attributes**: For every section heading listed in `/sourcemap.json`, the corresponding HTML heading element on the page must have a `data-source` attribute set to `<source>:<line>` (e.g., `docs/intro.md:23`).

3. **Edit Prompts**: If your site features an "Edit with your agent" button:
   * **Format**: The prompt generated must name the source path, the line, and the section's current text. It must not include other page content.
   * **No silent sending**: The control must only copy the prompt to the clipboard or open a user-chosen destination; it must not send text over the network without the user's explicit action.
   * **Best practice (SHOULD)**: The control should carry a `data-edit-prompt` attribute. If it relies on JavaScript, it should start with the `hidden` HTML attribute and be revealed by the script.

4. **Schema descriptions (SHOULD)**: Every property in your content schemas should have a `description`, and properties with a fixed set of values should list them in `enum`. Schemas should reject unknown keys by setting `additionalProperties` or `unevaluatedProperties` to `false`.

## Level L3: The agent-skills index

At Level 3, an agent can discover how to edit the site entirely from the live web, without needing the source repository up front.

1. **Publish an Agent-Skills Index**: The output folder must contain `/.well-known/agent-skills/index.json`.
   * **Format**: It must contain a `skills` array with at least one entry, each having a `name`, `description`, and `url`.

2. **Resolve Skills**: Every `url` in the index must resolve to a `SKILL.md` file on the site (in the output folder).
   * **Match details**: The front matter of the resolved `SKILL.md` must have a `name` matching the index entry and a non-empty `description`.

3. **Provide an Editing Skill**: At least one `SKILL.md` must explain how to edit the site.
   * It must contain an absolute `https` URL to the site's source repository (not on the site's own origin).
   * It must contain the text `AGENTS.md`.
