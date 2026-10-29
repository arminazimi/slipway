# create-slipway

Creates a [Slipway](https://github.com/arminazimi/slipway) site in a new folder.

```bash
npx create-slipway my-site                                   # asks for what is missing
npx create-slipway my-site --title "My site" --lang fa --yes # agents: flags only, never prompts
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `<dir>` | (required) | Folder for the site. It must be empty or not exist (a lone `.git` is fine). |
| `--title` | the folder name | Site title. |
| `--lang` | `en` | Language code, such as `en`, `fa`, or `pt-BR`. |
| `--mode` | `remote` | `remote`: `remote_theme` on GitHub Pages. `gem`: `theme: slipway-theme`. `template`: the theme files live in the site. |
| `--yes`, `-y` | | Never prompt. Without a terminal on stdin it never prompts either. |

It copies `examples/bare` and `starter-files/` from this repository, then writes `_config.yml` and a `Gemfile`. It never touches the network.

Exit codes: `0` created, `1` bad usage, `2` the folder is not empty.

In the repository, run it as `node packages/create-slipway/bin/create-slipway.mjs`. `npm pack` copies the starter and the theme into `template/` first (`scripts/bundle.mjs`), so the package works on its own.

## Agent verification loop

The Gemfile installs the Pages dependency versions with `require: false`: local builds use Jekyll directly so custom plugins run, rather than loading the Pages safe-mode wrapper.

The CLI copies local schemas and the source-map/twin plugins in every mode, including the packed npm template. A local or Actions build targets **L2**; classic Pages safe mode does not run these plugins.

```sh
npx create-slipway my-site --yes
cd my-site
bundle install
bundle exec jekyll build
npx slipway doctor . --build _site --level L2
```

Add `about.md` with `title: About` and `layout: page` in YAML front matter. Build and run the same Doctor command. Change `title` to a list (`title: [About]`): Doctor reports `about.md:2`. Restore the string, rebuild, and Doctor exits 0 with no failed MUST checks through L2. L3 skill discovery and schema style warnings may still be reported; this is conformance at the starter's claimed level, not an empty report.

Doctor does not check arbitrary broken content links. The link-break → Markdown-line → repair loop belongs to the Seaworthy integration tracked in [#69](https://github.com/arminazimi/slipway/issues/69). The standalone agent epic's exit criterion uses a schema error until that integration is delivered.
