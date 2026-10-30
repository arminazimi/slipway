# Blocks

Blocks are presentation includes that authors add to a page with one Liquid tag: badges, endpoints, terminals, timelines, and similar. Each block is a small, self-contained piece of markup with its own documentation page, test, and, when it needs one, its own stylesheet.

This guide is for theme contributors. Authors who only use blocks should start at the [block reference](../site/blocks/index.md), which links to a live example of every block.

## File layout

A block named `callout` has four files:

| Piece | Path | Required |
| --- | --- | --- |
| Include | `_includes/blocks/callout.html` | yes; this is the block |
| Stylesheet | `assets/css/components/callout.css` | only when the block has styles |
| Documentation | `site/blocks/callout.md` | yes |
| Test | `tools/theme/block-callout.test.mjs` | yes |

The include file name is the block name. It is also the name passed to `component-css.html`, the stylesheet name, the documentation page name, and the test file suffix, so a block has one name everywhere.

`tools/theme/blocks-complete.test.mjs` discovers every `_includes/blocks/*.html` file and checks the other three pieces. There is no list to update when a block is added or removed.

## Naming

- Use kebab-case for the block name: `pull-quote`, not `pull_quote` or `PullQuote`.
- Prefix classes with `sl-`: the block root is `sl-callout`, and its parts are `sl-callout-title`, `sl-callout-body`, and so on. Do not use a utility-class framework or a bare class name.
- Title the documentation page `"<Name> block"`, for example `title: Callout block`.
- Keep styles in the block's own component file. Do not append them to `assets/css/slipway.css`.

## Include parameters

A Liquid include receives its arguments under the `include.` namespace. Read them as `include.label`, `include.items`, and so on. Give optional parameters a default with the `default` filter:

```liquid
{%- assign status = include.status | default: "stable" -%}
{%- assign method = include.method | upcase | default: "GET" -%}
```

The filters run left to right, so `method` is upper-cased when it is present and falls back to `GET` when it is not. `default` replaces `nil`, `false`, and an empty string.

Pass structured data from the front matter rather than trying to build arrays inside the include tag:

```yaml
---
title: Example
steps:
  - title: Install
    description: Run the installer.
  - title: Build
---
```

```liquid
{% include blocks/steps.html steps=page.steps %}
```

For a multiline string, such as terminal commands, use a YAML block scalar with the chomping indicator so the trailing newline does not become an empty command:

```yaml
commands: |-
  npm install
  npm run test
```

Parameters used by the blocks in this repository:

| Block | Parameters and defaults |
| --- | --- |
| `badge` | `label` (required), `status` (`"stable"`) |
| `compare` | `pros` and `cons`, or `headers` and `features`; renders nothing when neither pair is set |
| `endpoint` | `method` (`"GET"`), `path`, `parameters`, `request`, `response` |
| `file-tree` | `list` (a Markdown list), or `items` (nested `name`, `note`, `children`, up to four levels) |
| `gallery` | `images` (required; `src`, `alt`, and optional `caption`, `credit`, `srcset`, `width`, `height`, `lazy`) |
| `kbd` | `mac` and `other` (both required) |
| `pull-quote` | `text` (required), `author`, `source`, `url` |
| `stats` | `items` (required; `label`, `value`, and optional `unit`, `trend`) |
| `steps` | `steps` (required; `title`, `url`, `description`) |
| `terminal` | `commands` (required, newline-separated), `output`, `prompt` (`"$"`) |
| `timeline` | `events` (required; `date`, `title`, `url`, `description`) |

## Styles

When a block needs styles, put them in `assets/css/components/<name>.css` and link the file from the top of the include:

```liquid
{%- include component-css.html name="callout" -%}
<div class="sl-callout">...</div>
```

`component-css.html` emits `<link rel="stylesheet" href="/assets/css/components/callout.css">` once per page, however many times the block appears. Do not write a `<link>` tag by hand and do not put component CSS in the main stylesheet.

Older blocks in this repository load their CSS from their documentation page or their test fixture instead of from the include. The completeness test accepts either arrangement: a component stylesheet must be referenced by the include, the documentation page, or the block test. New blocks should link from the include, which keeps a page correct without relying on the layout or fixture.

### Logical CSS and right-to-left

Use logical properties so the same stylesheet works in left-to-right and right-to-left pages:

- `margin-inline-start` and `margin-inline-end` instead of `margin-left` and `margin-right`
- `padding-inline`, `padding-block`, and their `-start` and `-end` forms
- `border-inline-start` instead of `border-left`
- `inset-inline-start` instead of `left`

Use theme tokens (`var(--sl-space-4)`, `var(--sl-color-text)`, and so on) rather than raw values. `node tools/theme/logical-css.mjs` rejects physical direction properties in `assets/css/`, and `npm run check` runs it.

Some content always reads left to right, whatever the page direction: code, commands, paths, and URLs. Set `dir="ltr"` on that element inside the include, as `terminal.html` and `endpoint.html` do. Text that should follow the page direction must not set `dir`.

### CSS budget

All CSS under `assets/css/**/*.css` must total at most 52 KB (53248 bytes) raw. The budget leaves roughly 10 KB of headroom for each of the twelve blocks tracked in Epic #669. Check it with:

```sh
node tools/theme/css-budget.mjs
```

`npm run check` runs the same check. A new block adds one component file; it does not get a larger share of the budget by moving rules into `slipway.css`.

## Documentation page

Create `site/blocks/<name>.md` with `layout: page` plus a title and description. Keep the sample data in the front matter and pass it to the include, so the page shows the real parameter shape:

```markdown
---
title: Callout block
description: A short emphasized note.
layout: page
text: Remember to run the tests.
---

## Basic

{% include blocks/callout.html text=page.text %}
```

Show every meaningful variant, including the default and any custom parameter. If the block contains translatable text, add a right-to-left example wrapped in `<div dir="rtl">`; the pages for `steps`, `timeline`, and `endpoint` do this. If the block does not link its own stylesheet, link it from the page:

```markdown
{::nomarkdown}{% include component-css.html name="callout" %}{:/nomarkdown}
```

Finally, add a section to `site/blocks/index.md` with a copyable snippet and a link to the page:

````markdown
## Callout

```liquid
{% raw %}{% include blocks/callout.html text=page.text %}{% endraw %}
```

See [Callout block](./callout.html) for data setup.
````

The index is part of the reference: `tools/theme/blocks-reference.test.mjs` fails when a documentation page is missing from it, and the completeness test checks the same include snippet without needing a Ruby build.

## Test

Create `tools/theme/block-<name>.test.mjs` with `node:test` and `assert/strict`. Build a throwaway site in `.tmp/` with `buildExample` from `./build.mjs`, then assert the rendered markup and the stylesheet link. Copy `tools/theme/block-badge.test.mjs` as the starting point:

```js
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("callout block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-callout-out");
  const testSite = join(root, ".tmp/block-callout-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(join(testSite, "_layouts", "default.html"), `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`);
  writeFileSync(join(testSite, "index.md"), `---
layout: default
text: Remember to run the tests.
---
{% include blocks/callout.html text=page.text %}`);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");
  assert.match(html, /<div class="sl-callout">/);
  assert.match(html, /<link rel="stylesheet" href="\/assets\/css\/components\/callout.css">/);
});
```

Test the block's contract, not the whole stylesheet: the root class, each variant, escaping, and the CSS link. The test must reference the block's include; the completeness test checks that, so a test that builds an unrelated page does not count.

`tools/check.mjs` finds every `tools/**/*.test.mjs` file automatically. There is no registry to edit.

## Add a block: end to end

1. Choose a kebab-case name and create `_includes/blocks/<name>.html`. Read every parameter from `include.` and give optional ones a default.
2. If the block has styles, add `assets/css/components/<name>.css`, use tokens and logical properties, and link it with `{% include component-css.html name="<name>" %}` at the top of the include.
3. Create `site/blocks/<name>.md` with sample data, a basic example, each variant, and a right-to-left example when the content can be translated.
4. Add a section with a copyable snippet and a link to `site/blocks/index.md`.
5. Create `tools/theme/block-<name>.test.mjs`, build a fixture site, and assert the markup and CSS link.
6. Run the focused checks:

   ```sh
   node --test tools/theme/blocks-complete.test.mjs
   node --test tools/theme/block-<name>.test.mjs
   node tools/theme/css-budget.mjs
   node tools/theme/logical-css.mjs
   ```

7. Run `npm run check`. It runs the rest of the theme checks and every build test.
8. Add a one-line fragment in `changelog.d/<issue>.md` when the block is user-facing.

## What the completeness test enforces

`tools/theme/blocks-complete.test.mjs` discovers blocks from `_includes/blocks/*.html` and reports one test per block. A block fails when:

- its name is not kebab-case;
- `site/blocks/<name>.md` is missing, does not include `blocks/<name>.html`, or is not listed in `site/blocks/index.md`;
- `tools/theme/block-<name>.test.mjs` is missing or does not include `blocks/<name>.html`;
- the include links a `component-css.html` under a different name, or links a stylesheet that does not exist;
- a stylesheet exists at `assets/css/components/<name>.css` but no include, documentation page, or test links it.

Each failure names the block and the files involved. The test needs no Ruby or network access, so it runs before the build tests and points at the missing file instead of a build error.
