---
name: slipway-deploy
description: Publish a Slipway site to GitHub Pages with the deploy Action, set a custom domain, and fix the common build, base path, theme, and permission failures.
metadata:
  version: "0.3.0"
---

# Publish a Slipway site to GitHub Pages

Slipway has one mode: the engine builds the site into a folder, and the deploy Action uploads that folder. GitHub Pages serves the files; it does not build the site. If the site has an `AGENTS.md`, read it first; it wins where it differs from this Skill.

Turning on Pages, choosing its source, and adding a custom domain are repository settings. Ask the owner to make those changes; do not make them yourself.

## 1. Take a baseline

From the site folder, before you change anything:

```sh
slipway check .
slipway build . --out dist
```

Keep the output: the deploy is done when it adds no diagnostic. `slipway` is the engine's command line, released with the engine (`engine.cli`). Until it is installed, say so in your report and do not invent a result.

The [doctor skill](../slipway-doctor/SKILL.md) says how to read the report the deploy Action runs when its `doctor` input is true.

## 2. Set the config

```yaml
# slipway.yml
title: My site
url: https://example.github.io
base: /my-site
```

`url` is the scheme and host, with no path and no trailing slash. `base` is the path the site lives under, with a leading slash and no trailing slash. A project site is served under `/<repository>`, so `base` must match the repository name; a user site at the domain root and a site at a custom domain leave `base` empty.

Without `url`, canonical links, the sitemap, and social images are relative or left out, and the engine warns. The Action does not rewrite URLs, so `base` and the repository name must agree.

## 3. Add the deploy workflow

The Action installs Node, builds with the engine, runs `slipway check`, optionally runs the doctor, and deploys with the official Pages actions. Add `.github/workflows/deploy.yml`:

```yaml
name: deploy

on:
  push:
    branches: [main]

permissions: {}

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
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
          doctor: "true"
```

`path` is the site folder, `node-version` defaults to `24`, and `doctor` defaults to `false`. With `doctor: "true"` the step fails when a MUST in the agent-editable spec fails. The output `page_url` is the deployed address.

The Action deploys in the job that runs it, so the job needs `pages: write`, `id-token: write`, and the `github-pages` environment. It always deploys: do not call it on `pull_request`. Build a pull request in a job that uses `action/setup`, then runs `slipway check .` and `slipway build . --out dist`.

Ask the owner to open Settings, Pages, set **Build and deployment**, Source to **GitHub Actions**, and push to the branch the workflow names.

## 4. Set a custom domain

1. Ask the owner to enter the host under Settings, Pages, **Custom domain**, and save it. That starts GitHub's DNS check.
2. At the DNS provider, point an apex domain with the A and AAAA records GitHub lists, or an ALIAS/ANAME record when the provider has one; point `www` or any other subdomain with a CNAME record to `<owner>.github.io`. The records are in the [GitHub Pages documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
3. Keep a `CNAME` file at the site root with only the host, such as example.org: no scheme, no path, no trailing slash. The engine copies it into the build.
4. Set `url` to the domain and remove `base`:

```yaml
# slipway.yml
url: https://example.org
```

5. When the DNS check passes, ask the owner to turn on **Enforce HTTPS**. The certificate can take time to issue, and the option stays unavailable until it does.
6. Check the canonical link, the sitemap, and the social image in the deployed page source: they use `url`, so a stale project host means the config still needs the domain.

## 5. Fix a failed deploy

| What you see | Cause | Fix |
| --- | --- | --- |
| The page has no styles and links 404 under the project path | `base` is missing, or it does not match the repository name | Set `base` to `/<repository>` with a leading slash and no trailing slash |
| Styles and links name the project path on a custom domain | `base` is still set | Remove `base` and set `url` to the domain |
| The build fails and names a file and a line | Invalid YAML, front matter, or Markdown | Fix that line, run `slipway check .`, and build again |
| The deploy ran but the page is old or missing | The Pages source is not GitHub Actions, or the workflow watches another branch | Set the source to GitHub Actions and push to the branch the workflow names |
| The deploy job fails with a permission error | The workflow lacks `pages: write` or `id-token: write`, or the `github-pages` environment | Copy the permissions and environment from section 3 |
| The doctor step fails | The built site misses a MUST in the agent-editable spec | Fix the findings; set `doctor: "false"` only while the site does not reach L1 |
| The build names a theme it cannot find | `theme.name` points at a missing package or folder | Remove `theme.name` for the default theme, or fix its path |
| The custom domain is reported as improperly configured | DNS does not point at Pages, or `CNAME` has a scheme, a path, or the wrong host | Fix the records; put only the bare host in `CNAME`, then wait for the check |

## 6. Verify the deploy

1. Run the section 1 commands again. Fix every diagnostic that names a file you changed, and stop when the output is the same as the baseline or cleaner.
2. Open the URL Settings, Pages reports. The home page loads with the theme's styles, and one subpage loads from its link.
3. In the page source, an asset URL starts with the project path on a project site, and with `/assets/` at a domain root. On a custom domain, the canonical link names the domain.
4. Open the latest Actions run: the build and check must pass before the upload, and the deploy job prints the deployed URL.
5. Open `/sitemap.xml`, `/robots.txt`, and `/llms.txt` under the site URL. They are build outputs, so a missing one means the build did not include it.

## Never

- Never turn on Pages, pick its source, add a custom domain, change DNS, or enforce HTTPS yourself; ask the owner.
- Never commit `dist/` or edit a built folder; the build replaces it.
- Never add `.nojekyll`, a `Gemfile`, or `_plugins/`; the engine needs none of them.
- Never run the deploy Action on `pull_request`, where a job cannot deploy.
- Never set `base` to a full URL or end it with a slash; `url` holds the scheme and host, `base` the path.
- Never put a scheme, a path, or a trailing slash in `CNAME`; it holds the host only.
