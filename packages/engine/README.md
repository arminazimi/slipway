# Mizzen (`@velella/mizzen`)

A deterministic docs engine with exact source positions: config, the content model, Markdown, navigation, the render host, outputs, diagnostics, and the CLI ([ADR 0022](../../docs/adr/0022-engine.md), [ADR 0023](../../docs/adr/0023-engine-theme-boundary.md)). It moves to its own repository, `velella-sh/mizzen`, after 0.3.0 (ADR 0025 in [docs/adr](../../docs/adr/README.md)).

It knows nothing about the theme: nothing here imports from `packages/theme/`, and no theme name, color, or layout appears in it. `tools/engine-boundary` enforces it.

A build runs eight stages, each a function from typed input to typed output: config, discover, front matter, Markdown, HTML, site model, render, and outputs. Stages talk only through the frozen types in `src/contracts/`. The same input gives byte-identical output, in the same order, with LF line endings.

## No build step

The source is TypeScript that Node runs directly through type stripping (Node 24 or later). Use only erasable syntax (no `enum`, `namespace`, or parameter properties), import local files with their `.ts` extension, and mark type-only imports with `import type`. `tsconfig.json` enforces this and emits nothing; never commit compiled output.

## Commands

From the repository root:

- `npm run check` runs the tests below and the type check with everything else.
- `npm test --workspace @velella/mizzen` runs `node --test` on `test/**/*.test.ts`.
- `npm run typecheck --workspace @velella/mizzen` runs `tsc --noEmit`.

## CLI

The package installs one command, `mizzen`, from `bin/slipway.ts`. Its help is the source of truth for the flags:

```text
Usage: mizzen <command> [dir] [options]

Commands:
  build [dir]   Build the site into --out (default: dist)
  check [dir]   Build to a temp folder and print diagnostics only
  verify [dir]  Check a built folder against the hash in its manifest

Options:
  --out <dir>          Output folder for build (default: dist)
  --theme <dir>        Theme root folder (layouts/, chrome/, components/)
  --format <format>    text, json, or sarif (check only; default: text)
  --hash <hex>         Expected build hash for verify (default: the manifest's)
  -h, --help           Show this help

Exit codes: 0 ok, 1 errors, 2 usage.
```

From this repository, run it as `node packages/engine/bin/slipway.ts`; from a site that installed the package, as `mizzen`.

| Command | What it does |
| --- | --- |
| `mizzen build [dir] --out <dir> --theme <dir>` | Builds `dir` (default `.`) into `--out` (default `dist`). Prints diagnostics as text. A build with an error still writes the site and exits `1`. |
| `mizzen check [dir] --format text\|json\|sarif --theme <dir>` | Builds into a temporary folder, prints only the diagnostics in the chosen format, and removes the folder. Exits `1` on an error. |
| `mizzen verify [dir] --hash <hex>` | Hashes a built folder by the same rule the build used and compares it with `.slipway/manifest.json` (or `--hash`). Exits `1` on a mismatch. |

`--out` is resolved from the current working directory, not from the site root. `check` is the command to use in CI: it never touches `dist`.

The theme root is picked in this order:

1. `--theme <dir>`, resolved from the current working directory.
2. `theme.name` in `mizzen.yml`: a folder relative to the site root, an absolute path, or a package name resolved from the site and then from the current directory.
3. The `theme` folder beside this package, when it exists.

A page with no layout in its front matter or in `defaults` gets the layout `doc` from the CLI. A programmatic build has no default unless it passes `defaultLayout`.

## Config

A site's settings live in `mizzen.yml` at its root; every path in the file is relative to that folder. Without the file the engine builds with the defaults below and the folder name as the title. The top level is closed: an unknown key is an error with its line and column. The schema is [`schema/config.schema.json`](schema/config.schema.json), and `SiteConfig` in `src/contracts/config.ts` is the same shape.

| Key | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | string | the folder name | Site name in the header, page titles, `llms.txt`, and JSON-LD. |
| `description` | string | | One-sentence summary for the home page's meta description and `llms.txt`. |
| `url` | string | | Scheme and host of the published site, without a trailing slash, such as `https://example.com`. Needed for canonical links, social images, and an absolute sitemap; without it they are relative or left out, with a warning. |
| `base` | string | `""` | Path the site lives under, starting with `/` and without a trailing slash; empty at a domain root. Every URL the engine writes carries it. |
| `lang` | string | `en` | Default language of every page, as a BCP 47 tag. A page's `lang` wins. |
| `dir` | `ltr` or `rtl` | from `lang` | Default text direction: `rtl` for `fa`, `ar`, `he`, `ur`, and the other right-to-left languages. A page's `dir` wins. |
| `languages` | list of `{code, name, prefix}` | `[]` | The site's languages, in switcher order. Leave it out for a one-language site. |
| `source` | string | `.` | Folder that holds the content, relative to the site root. Files outside it are not pages. |
| `include` | list of strings | `[]` | Paths under `source` that discovery would skip (names starting with `.` or `_`) but should copy or build, such as `.well-known`. |
| `exclude` | list of strings | `[]` | Paths under `source` that are neither pages nor copied. `node_modules`, the output folder, and `mizzen.yml` are always excluded. |
| `navigation` | string | `_data/navigation.yml` | Navigation file, relative to the site root. Without it, navigation is built from folders and each page's `order`. |
| `defaults` | list of `{path, values}` | `[]` | Front matter applied to every page under a path unless the page sets the key itself. Later entries win over earlier ones; a page always wins. |
| `repository` | `{url, branch, dir}` | | Where the source lives, for "Edit this page" links and the "Edit with your agent" prompt. `branch` defaults to `main`; `dir` is the site root's folder in the repository, default `""`. |
| `theme` | `{name, options}` | | The theme package or folder, and the options handed to it unread. The theme validates its own options. |
| `search` | `false` or `{text}` | `{}` | `false` builds no search index. `text` is the most characters of a page's body the index keeps (default `300`); titles and headings are always indexed. |
| `redirects` | map of path to path or URL | `{}` | Redirect pages: each key is an old path under `base`, each value a path on the site or an `https` URL. |
| `outputs` | map of name to boolean | every output on | Turns one output off by its name, such as `twins: false`. The names are in [Outputs](#outputs). |

```yaml
title: Beacon
description: Documentation for the Beacon deploy CLI.
url: https://example.com
base: /beacon
lang: en
source: docs
navigation: _data/navigation.yml
repository:
  url: https://github.com/example/beacon
  branch: main
  dir: docs
defaults:
  - path: ""
    values:
      layout: doc
search:
  text: 300
redirects:
  /old/: /new/
outputs:
  twins: false
```

`mizzen.config.ts` is not a second config file. It holds code only: the site's plugins, default-exported as `{ plugins: [...] }`. It cannot set a key of `mizzen.yml`, so every setting stays readable without running the site's code.

## Programmatic API

The package exposes two entry points today:

| Entry | Exports |
| --- | --- |
| `@velella/mizzen` | `version`. |
| `@velella/mizzen/contracts` | The frozen contract types, type-only. |

Inside the repository, each stage is a function with typed input and output:

| Function | File | Returns |
| --- | --- | --- |
| `build(options)` | `src/pipeline/build.ts` | `BuildResult`: the output folder, every file written (sorted), and every diagnostic. |
| `buildModel(root)` | `src/model/build.ts` | `ModelResult`: the complete site model plus diagnostics. It parses, renders Markdown, and builds navigation, but writes nothing. |
| `loadConfig(root, options?)` | `src/config/load.ts` | `LoadConfigResult`: a complete `SiteConfig` after defaults, plus diagnostics. |
| `loadRegistry(themeRoot)` | `src/render/registry.ts` | `ThemeRegistry`: the theme manifest, layouts, chrome, and components. |
| `loadCodeConfig(root, options?)` | `src/plugins/hooks.ts` | `LoadedCode`: the site's plugins and diagnostics. See [Plugins](#plugins). |

`build()` takes:

- `root`: the site root, the folder that holds `mizzen.yml`.
- `out`: the output folder, replaced as a whole. It must be outside `source`, or its first segment must start with `_` or `.`, as in `_site`.
- `themeRoot`: the theme's root folder, which holds `src/index.ts` and the `layouts/`, `chrome/`, and `components/` folders.
- `themeFiles`: theme files to copy, as paths relative to `themeRoot`; each lands under `assets/theme/` with its hash in the name.
- `defaultLayout`: the layout for a page that names none; without it such a page is an error.
- `outputsDir`: the folder outputs are read from; default `src/outputs/`.

Every output runs first, in memory, and its files are checked: a path outside `out` is an error, and so is a path two outputs both write (the first one wins). Then the site is written to a staging folder beside `out` and swapped in only when complete. A site's own file wins over an output's file at the same path, with no diagnostic. Problems in content and theme come back as diagnostics; a throw means a bug, such as an output or layout that threw, and leaves `out` as it was.

<!-- readme-example: programmatic-build -->
```ts
import { build, type BuildResult } from "../src/pipeline/build.ts";

/** Builds a site and returns what was written. */
export function buildSite(root: string, out: string, themeRoot: string): Promise<BuildResult> {
  return build({ root, out, themeRoot, defaultLayout: "doc" });
}
```

`buildModel()` is the API for a tool that reads the site without writing it, such as a linter or an MCP server. Its diagnostics are the same ones a build reports.

## Outputs

Each `*.ts` file in an outputs folder is one unit. The pipeline finds them by listing the folder in file-name order; adding one needs no edit to a shared index. A file exports exactly one `Output`, under any export name, and its `name` must equal the file name without `.ts`. A file that exports no output is a helper and is not run.

| Name | Writes |
| --- | --- |
| `agents-md` | `AGENTS.md`, a guide to the built site for agents. |
| `html` | One HTML file per document page, at the page's pretty URL. |
| `llms` | `llms.txt`, following llmstxt.org. |
| `llms-full` | `llms-full.txt`, every page's Markdown in one file. |
| `manifest` | `.slipway/manifest.json`, the page list and per-page source and HTML hashes. |
| `page-json` | One JSON file per document page (`index.json` for a pretty URL): URL, title, description, headings, source, last change, and estimated tokens. |
| `robots` | `robots.txt`, with the sitemap address when the config has `url`. |
| `search` | `pagefind/`, a static search index. |
| `sitemap` | `sitemap.xml`. |
| `sourcemap` | `sourcemap.json`, the line-exact source map ([format](../../spec/sourcemap/v0.md)). |
| `twins` | One Markdown twin per document page: the same URL with `.md` in place of the HTML file. |

`outputs` in `mizzen.yml` turns one off by name:

```yaml
outputs:
  twins: false
  search: false
```

The contract is in `src/contracts/output.ts`:

```ts
interface Output {
  readonly name: string;
  run(site: Site, ctx: OutputContext): Promise<readonly OutputFile[]>;
}
```

`ctx.renderPage(page)` renders a page to a complete HTML document through the theme. `ctx.report(diagnostic)` records a finding; an output reports a content problem instead of throwing. `run()` returns files sorted by path, each `{ path, contents }`, where `path` is relative to the output folder and uses `/`, and `contents` is a string (UTF-8, LF) or a `Uint8Array`.

A custom outputs folder is passed to `build()` as `outputsDir`. It replaces the built-in folder for that build, so a custom output can either live beside the built-ins or be the whole set.

<!-- readme-example: custom-output -->
```ts
import type { Output } from "@velella/mizzen/contracts";

/** Writes feed.txt; the file name must be feeds.ts, so the output's name is feeds. */
export const feeds: Output = {
  name: "feeds",
  async run() {
    return [{ path: "feed.txt", contents: "hello\n" }];
  },
};
```

## Plugins

A site adds behavior from `mizzen.config.ts` at its root. The file default-exports its plugins and nothing else:

```ts
import type { Plugin } from "@velella/mizzen/contracts";

export default {
  plugins: [
    /* Plugin objects, in the order they run. */
  ],
};
```

A site without the file is an ordinary site: no plugins, no diagnostics. A file Node cannot import, or a default export without a `plugins` list, is one error naming the file. An entry that is not a plugin is dropped with an error and the sound entries still run.

A plugin is a `name` for diagnostics and any of three hooks. Each hook receives a value and returns the value the next plugin receives; none mutates its input. A hook may be async, and it is awaited before the next plugin runs.

| Hook | Runs | Receives | Returns |
| --- | --- | --- | --- |
| `content` | Once per page, after its Markdown is parsed and before the site model is assembled. | `Page` | `Page` |
| `model` | Once, after the site model is assembled and before anything is rendered. | `Site` | `Site` |
| `outputs` | Once, with the files the outputs produced and the site they came from, before the files are written. | `readonly OutputFile[]`, `Site` | `readonly OutputFile[]` |

A hook that throws, or returns something the stage cannot use, is an error naming the plugin. The value the stage carried before that plugin is kept and the plugins after it still run, so one bad plugin costs its own work and nothing more. The diagnostic id is `plugin.hook-failed`.

<!-- readme-example: plugin -->
```ts
import type { Plugin } from "@velella/mizzen/contracts";

const banner: Plugin = {
  name: "banner",
  content(page) {
    return { ...page, frontMatter: { ...page.frontMatter, banner: true } };
  },
};

export default { plugins: [banner] };
```

The loader and the hook runners are `loadCodeConfig()`, `runContentHooks()`, `runModelHooks()`, and `runOutputsHooks()` in `src/plugins/hooks.ts`. Each runner returns `{ value, diagnostics }` and never fails the stage. The pipeline does not call them yet: `build()` does not load `mizzen.config.ts` in this version, so a site's plugins are not applied by the CLI until that wiring lands.

## Layout

- `src/index.ts`: the public entry. It exports only `version` for now.
- `src/contracts/`: the frozen types every stage shares; types only, nothing runs.
- `src/config/`, `src/content/`, `src/markdown/`, `src/model/`, `src/nav/`, `src/pipeline/`, `src/plugins/`, `src/render/`, `src/outputs/`, `src/source/`: the pipeline's stages and units.
- `src/outputs/`: one file per output; see its [README](src/outputs/README.md).
- `bin/slipway.ts`: the `mizzen` command.
- `schema/config.schema.json`: the site config schema.
- `test/`: `*.test.ts` files for `node --test`.
