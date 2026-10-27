# Editor autocomplete

Slipway publishes JSON Schemas for the files you edit by hand. An editor that runs the [YAML language server](https://github.com/redhat-developer/yaml-language-server) uses them to complete keys, show each key's description on hover, and underline a wrong value as you type. Nothing here is needed to build the site: the build and `npm run check` validate the same files without an editor.

| File | Schema |
| --- | --- |
| `_config.yml` (and overlays such as `_config.remote.yml`) | [`schema/slipway-config.schema.json`](../schema/slipway-config.schema.json) |
| `_data/navigation.yml` | [`schema/navigation.schema.json`](../schema/navigation.schema.json) |

Point your editor at the stable URLs of the schemas for your version of the spec.

```text
https://arminazimi.github.io/slipway/spec/0.1/slipway-config.schema.json
https://arminazimi.github.io/slipway/spec/0.1/navigation.schema.json
```

## Any editor: a comment on the first line

The YAML language server reads a schema from a comment at the top of the file. This works in every editor below without other settings:

```yaml
# yaml-language-server: $schema=https://arminazimi.github.io/slipway/spec/0.1/slipway-config.schema.json
title: My site
```

The examples in this repository use relative paths (`../../schema/slipway-config.schema.json`), so they complete offline and always match the schema next to them.

## VS Code

1. Install the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) by Red Hat.
2. Copy [`starter-files/.vscode/settings.json`](../starter-files/.vscode/settings.json) into your site, or add its `yaml.schemas` block to your own `.vscode/settings.json`. It maps `_config.yml`, `_config.*.yml`, and `_data/navigation.yml` to their schemas, so you do not need the comment line.
3. Open `_config.yml` and type `slipway:` then a new indented line: <kbd>Ctrl</kbd>+<kbd>Space</kbd> lists `tokens`, `languages`, and `persian`.

## Neovim

With [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig) and `yaml-language-server` installed:

```lua
require("lspconfig").yamlls.setup({
  settings = {
    yaml = {
      schemas = {
        ["https://arminazimi.github.io/slipway/spec/0.1/slipway-config.schema.json"] = { "_config.yml", "_config.*.yml" },
        ["https://arminazimi.github.io/slipway/spec/0.1/navigation.schema.json"] = "_data/navigation.yml",
      },
    },
  },
})
```

## Zed

Zed ships the YAML language server. Add to your project's `.zed/settings.json`:

```json
{
  "lsp": {
    "yaml-language-server": {
      "settings": {
        "yaml": {
          "schemas": {
            "https://arminazimi.github.io/slipway/spec/0.1/slipway-config.schema.json": ["_config.yml", "_config.*.yml"],
            "https://arminazimi.github.io/slipway/spec/0.1/navigation.schema.json": ["_data/navigation.yml"]
          }
        }
      }
    }
  }
}
```

## Front matter

Front matter is YAML inside a Markdown file, and the YAML language server only opens `.yml` and `.yaml` files. A `yaml.schemas` glob such as `"*.md"` does not work, and neither does the comment line, because the Markdown language server owns the file. What you can do:

- Rely on the build: the front-matter schemas ([#72](https://github.com/arminazimi/slipway/issues/72)) and the CI check that runs them ([#73](https://github.com/arminazimi/slipway/issues/73)) report each wrong field with its file, key, and allowed values.
- In VS Code, the [Front Matter CMS](https://frontmatter.codes/) extension shows a form for front matter. It reads its own `frontmatter.json` content types, not JSON Schema, so you describe Slipway's fields there by hand; Slipway does not generate that file yet.

## What does not work

- Keys that Jekyll or a plugin owns (`plugins`, `exclude`, `collections`) are allowed but not described: the schema checks only the keys the theme reads.
- Liquid in a value (`{{ site.title }}`) is a plain string to the editor, so it is never checked.
- The raw GitHub URLs need network access the first time; the editor caches them after that.
