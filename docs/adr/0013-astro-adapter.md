# 0013. The Astro adapter follows the framework-neutral content model using content loaders and endpoints

**Status:** Accepted (2026-12-21)

## Context

Issue #108 calls for designing the Astro adapter (`adapters/astro`) based on the framework-neutral content model defined in ADR [0003](0003-content-model.md). ADR 0003 specifies that content stays in Jekyll's layout (`_docs/`, `_posts/`), configuration is in `_config.yml`, navigation is in `_data/navigation.yml`, and front matter follows a specific schema without Liquid tags.

The Astro adapter needs to map this Jekyll-specific layout to Astro's content layer while producing the necessary artifacts (`sourcemap.json`, Markdown twins, and `data-source` attributes on headings) as specified in the Slipway agent-editable spec. It also needs to provide starter files for users.

## Method

Based on the research and proof of concept described in ADR 0003, we design the Astro adapter to leverage Astro's Content Collections and loaders, alongside Astro integrations and endpoints, to fulfill the Slipway requirements.

## Decision

The Astro adapter is designed with the following architecture to implement the framework-neutral content model:

1. **Content Mapping with Loaders**:
   - The adapter provides custom content loaders (e.g., `glob()`) to read `_docs/`, `_posts/`, and `_pages/`.
   - For `_posts/`, the loader includes logic to parse the Jekyll file naming convention (`YYYY-MM-DD-slug.md`). It splits the filename to extract the `date` and `slug` and injects them into the generated content entry's data, as Astro's default behavior uses the whole filename as the ID.

2. **Data Parsing**:
   - `_config.yml` and `_data/navigation.yml` (and `_data/i18n/<lang>.yml`) are parsed using a YAML reader (e.g., the `yaml` package) and exposed to the Astro site through shared data modules or a Virtual Module created by an Astro integration.

3. **Markdown Transformation (Remark Plugin)**:
   - A custom Remark plugin is used to attach `data-source="<source>:<line>"` attributes to every heading (and potentially track inline links). This fulfills the `ae.edit-prompt.source` requirement.
   - The plugin records the exact line numbers from the original source file to populate the source map.

4. **Artifact Generation (Endpoints and Build Hooks)**:
   - `sourcemap.json` (format v0) is generated. This can be achieved by aggregating data collected by the Remark plugin during the build process and writing the JSON file in an Astro integration's `astro:build:done` hook.
   - Markdown twins (`<page>/index.md`) are generated. Similar to the source map, the original Markdown content (stripped of front matter) is written to the output directory during the build phase.

5. **Starter Files**:
   - The `adapters/astro/starter/` directory will include necessary files for a new site to copy, such as `AGENTS.md`, content schemas (`content-schemas.json`), and the `schema/` directory for front matter validation, matching the patterns of the Hugo, Eleventy, and Docusaurus adapters.

## Consequences

- **Astro Integration**: The adapter will likely be an Astro Integration (`astro-integration`) that automatically sets up the loaders, the Remark plugin, and the build hooks, minimizing configuration for the user.
- **Dependencies**: It will require a YAML parser and AST manipulation tools (like `unist-util-visit` for the Remark plugin).
- **Compliance**: The design ensures Astro sites can achieve level L2 of the agent-editable spec by providing source maps, twins, and edit prompt sources, while strictly adhering to the neutral content model (ADR 0003).
- **Validation**: Like other adapters, `slipway doctor` will be used in tests (`test/astro.test.mjs`) to verify the output.
