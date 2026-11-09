// Where a new site's files come from. The docs template is written from the strings below: three
// pages under `docs/` and the deploy workflow. The `content-schemas.json` index points at two
// schemas, which the CLI copies next to it. In the repository those schemas are read in place; the
// published package carries the same files in template/, written by scripts/bundle.mjs.
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The schema files every generated site copies (ADR 0024, `content-schemas.json`). */
export function schemaPaths() {
  return ["schema/config.schema.json", "schema/front-matter/base.schema.json"];
}

/** The sources in a checkout of the repository. */
export function repoSources(repo = resolve(packageRoot, "../..")) {
  return {
    schemas: {
      "schema/config.schema.json": join(repo, "packages/engine/schema/config.schema.json"),
      "schema/front-matter/base.schema.json": join(repo, "schema/front-matter/base.schema.json"),
    },
  };
}

/** The sources inside the published package. */
export function bundledSources(base = join(packageRoot, "template")) {
  const schemas = {};
  for (const path of schemaPaths()) schemas[path] = join(base, path);
  return { schemas };
}

/** The bundled sources when the package carries them, else the repository's. */
export function findSources() {
  const bundled = bundledSources();
  return Object.values(bundled.schemas).every((path) => existsSync(path)) ? bundled : repoSources();
}

/** The three pages the docs template starts with, keyed by their path in the site. */
export function templatePages() {
  return {
    "docs/index.md": `---
title: Welcome
description: Start here.
layout: home
hero:
  eyebrow: Documentation
  lead: Build the site, preview it, and publish it to GitHub Pages.
actions:
  - label: Quickstart
    url: quickstart/
    primary: true
  - label: Configuration
    url: configuration/
---

## What is here

- [Quickstart](quickstart.md) builds the site and deploys it.
- [Configuration](configuration.md) explains the keys in \`mizzen.yml\`.
`,
    "docs/quickstart.md": `---
description: Build the site and publish it to GitHub Pages.
order: 1
---

# Quickstart

The site is Markdown in \`docs/\`, rendered by the engine with the theme. Every page is a file:

\`\`\`text
docs/index.md           /
docs/quickstart.md      /quickstart/
docs/configuration.md   /configuration/
\`\`\`

## Write a page

Create \`docs/about.md\` with a title and a few lines of Markdown:

\`\`\`markdown
---
title: About
description: Who we are.
---

# About

We write documentation.
\`\`\`

The title above the body is optional: without front matter, the first \`# heading\` is the title.

## Build and preview

\`\`\`sh
npx @velella/mizzen build . --out dist
\`\`\`

The build writes the site to \`dist/\`. Open \`dist/index.html\` in a browser, or serve the folder.

## Publish

The deploy workflow in \`.github/workflows/deploy.yml\` builds the site with the deploy Action and
publishes it to GitHub Pages on every push to \`main\`. In the repository, set Settings → Pages →
Source to **GitHub Actions** once, then push.
`,
    "docs/configuration.md": `---
title: Configuration
description: The keys mizzen.yml accepts.
order: 2
---

# Configuration

\`mizzen.yml\` sits at the site root; every path in it is relative to that folder. Every key is
optional. A site with no file builds with the folder name as its title.

\`\`\`yaml
title: My site
description: One sentence about the site.
lang: en
source: docs
url: https://example.github.io
base: /my-site
repository:
  url: https://github.com/example/my-site
\`\`\`

| Key | What it does |
| --- | --- |
| \`title\` | Site name in the header, page titles, and \`llms.txt\`. |
| \`description\` | One sentence for search results and link previews. |
| \`lang\` | Default language, as a BCP 47 tag such as \`en\` or \`fa\`. |
| \`source\` | Folder that holds the pages; \`docs\` in this site. |
| \`url\` | Scheme and host of the published site, without a trailing slash. |
| \`base\` | Path the site lives under, such as \`/my-site\`; empty at a domain root. |
| \`repository\` | Where the source lives, for "Edit this page" links. |
| \`defaults\` | Front matter applied to pages under a path. |

The full list is in the [engine's config schema](https://github.com/arminazimi/slipway/blob/main/packages/engine/schema/config.schema.json),
and the copy in \`schema/config.schema.json\` is the one \`content-schemas.json\` points at.
`,
  };
}

/** The deploy workflow: build with the engine and publish to Pages through the deploy Action. */
export const deployWorkflow = `name: deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions: {}

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment:
      name: github-pages
      url: \${{ steps.deploy.outputs.page_url }}
    permissions:
      contents: read
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - id: deploy
        uses: arminazimi/slipway/action/deploy@main
        with:
          path: .
`;

/** Writes the template into `site` and returns the paths written, relative to it. */
export function writeTemplate(site, sources) {
  const written = [];
  const write = (path, text) => {
    mkdirSync(dirname(join(site, path)), { recursive: true });
    writeFileSync(join(site, path), text);
    written.push(path);
  };
  for (const [path, text] of Object.entries(templatePages())) write(path, text);
  write(".github/workflows/deploy.yml", deployWorkflow);
  for (const [path, from] of Object.entries(sources.schemas)) {
    if (!existsSync(from)) throw new Error(`the schema is missing: ${from}`);
    mkdirSync(dirname(join(site, path)), { recursive: true });
    cpSync(from, join(site, path));
    written.push(path);
  }
  return written.sort();
}

/** Writes the sources into the package layout of bundledSources(). */
export function copySources(sources, out) {
  for (const [path, from] of Object.entries(sources.schemas)) {
    if (!existsSync(from)) throw new Error(`the schema is missing: ${from}`);
    mkdirSync(dirname(join(out, path)), { recursive: true });
    cpSync(from, join(out, path));
  }
}
