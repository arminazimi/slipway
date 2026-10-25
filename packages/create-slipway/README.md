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
