# create-slipway

Creates a [Slipway](https://github.com/arminazimi/slipway) docs site in a new folder. The site
builds with the engine, Mizzen, and the theme, Lateen; it needs no Ruby.

```bash
npx create-slipway my-site                                                # asks for what is missing
npx create-slipway my-site --title "My site" --repository me/my-docs --yes # agents: flags only
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `<dir>` | (required) | Folder for the site. It must be empty or not exist (a lone `.git` is fine). |
| `--title` | the folder name | Site title. |
| `--repository` | | The GitHub repository as `owner/name` or an https URL, for "Edit this page" links. An empty answer leaves it out. |
| `--lang` | `en` | Language code, such as `en`, `fa`, or `pt-BR`. |
| `--yes`, `-y` | | Never prompt. Without a terminal on stdin it never prompts either. |

It writes:

```text
mizzen.yml                          the site config
docs/index.md                       the home page
docs/quickstart.md                  the first guide
docs/configuration.md               the config reference
.github/workflows/deploy.yml        build and deploy to GitHub Pages
content-schemas.json                which schema checks which file
schema/                             the config and front matter schemas
```

For a project repository, `--repository owner/name` sets `url` to `https://owner.github.io` and
`base` to `/name`, so the deployed site's links work. A user or organization site, whose repository
is named `owner.github.io`, keeps `base: ""`. It never touches the network.

Exit codes: `0` created, `1` bad usage, `2` the folder is not empty.

In the repository, run it as `node packages/create-slipway/bin/create-slipway.mjs`. `npm pack` copies
the schemas into `template/` first (`scripts/bundle.mjs`), so the package works on its own.

## After creating a site

Edit the Markdown in `docs/`, then build and preview:

```sh
npx @velella/mizzen build . --out dist
```

Push to `main` and the deploy workflow builds the site with the
[deploy Action](../../action/deploy/README.md) and publishes it to GitHub Pages. Set the
repository's Settings → Pages → Source to **GitHub Actions** once. For an agent, the build writes an
`AGENTS.md` into the output that describes the site.
