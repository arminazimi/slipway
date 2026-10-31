---
name: slipway-deploy
description: Publish a Slipway site to GitHub Pages in classic or Actions mode, set a custom domain, and fix the common build, baseurl, theme, and plugin failures.
metadata:
  version: "0.2.0"
---

# Publish a Slipway site to GitHub Pages

Slipway runs on GitHub Pages in two modes: **classic**, where Pages builds a branch with its own Jekyll, and **Actions**, where your workflow builds the site and deploys the artifact. Both read the same files; the mode decides which plugins run. Read [the two modes](https://github.com/arminazimi/slipway/blob/main/docs/modes.md) and, if the site has an `AGENTS.md`, read that first; it wins where it differs from this skill.

Turning on Pages, choosing its source, and adding a custom domain are repository settings. Ask the owner to make those changes; do not make them yourself.

## 1. Take a baseline

Get the theme's checks once, into a folder outside the site:

```sh
git clone --depth 1 https://github.com/arminazimi/slipway "$HOME/.slipway"
cd "$HOME/.slipway" && npm ci && cd -
```

From the site folder, check the config and the front matter, build, and run the doctor. Keep the output: the deploy is done when it adds no finding and does not lower the level.

```sh
node "$HOME/.slipway/tools/theme/validate.mjs" .
bundle exec jekyll build
node "$HOME/.slipway/packages/doctor/bin/slipway.mjs" doctor . --build _site
```

The build needs a `Gemfile`. A site without one can add `gem "github-pages", group: :jekyll_plugins, require: false` and run `bundle install`. `require: false` matters: the Pages gem's normal require turns on safe mode, which skips `_plugins/`. Until the site has a `Gemfile`, run the doctor without `--build` and read the log of the Pages build after you push. [The doctor skill](../slipway-doctor/SKILL.md) says how to read its findings.

## 2. Choose the mode

| | Classic | Actions |
| --- | --- | --- |
| Who builds | Pages, from a branch | Your GitHub Actions workflow |
| Pages source | Deploy from a branch | GitHub Actions |
| Theme | `remote_theme` with `jekyll-remote-theme` | `remote_theme`, or `theme` from a `Gemfile` |
| Slipway's `_plugins/` | Ignored | Run, when copied into the site |
| Pick it when | The site needs no build step | You want the source map, twins, or generated social images |

Start in classic mode when you can. Moving to Actions later changes the Pages source and adds a workflow, not the content or the config.

## 3. Publish in classic mode

1. Keep `_config.yml` to the keys below. `remote_theme` works only with `jekyll-remote-theme`; the feed and sitemap plugins are optional, and a multilingual site keeps its own stubs instead.

```yaml
title: My site
lang: en
remote_theme: arminazimi/slipway
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
```

2. Ask the owner to open Settings, Pages, set **Build and deployment**, Source to **Deploy from a branch**, and choose the branch (`main`) and the folder (`/ (root)`).
3. Leave `url` and `baseurl` out. `jekyll-github-metadata` fills both from the repository and the Pages settings, including the project path and a custom domain. A `baseurl` copied from a local preview is the usual cause of a deployed site without styles.
4. Do not plan on `_plugins/`: classic Pages ignores custom plugins, so Slipway's source map, twins, and social images do not run there. A site that needs them either commits the files `npm run sourcemap` and `npm run twins` write, or moves to Actions.

## 4. Publish in Actions mode

1. Set `url` and `baseurl` in the config; an Actions build does not reliably fill them in. For a project site at https://example.github.io/my-site:

```yaml
title: My site
lang: en
url: https://example.github.io
baseurl: /my-site
remote_theme: arminazimi/slipway
plugins:
  - jekyll-remote-theme
  - jekyll-feed
  - jekyll-sitemap
```

A user or organization site (`<owner>.github.io`) and a site at a custom domain have no `baseurl`; leave it out.

2. Copy `_plugins/` from the theme repository into the site, and load the Pages gem in the `Gemfile` with `require: false` as in section 1. A theme cannot ship plugins, and the Pages gem's wrapper runs safe mode, which skips them; the site owns the source map, twins, and social images.
3. Ask the owner to set Settings, Pages, Source to **GitHub Actions**.
4. Add a workflow that builds with `bundle exec jekyll build`, uploads `_site` with the upload-pages-artifact action, and deploys with the deploy-pages action. `.github/workflows/deploy-site.yml` in the theme repository is a complete example: keep its `permissions` (`contents: read`, `pages: write`, `id-token: write`), its `concurrency` group `pages`, and the `github-pages` environment on the deploy job; build the site root instead of its `site` folder, and drop its spec build step.
5. Do not pass an empty `--baseurl` flag to the build on a project site; it overrides `baseurl` and produces the same missing styles. Omit the flag and let `_config.yml` supply the path.

## 5. Set a custom domain

1. Ask the owner to enter the host under Settings, Pages, **Custom domain**, and save it. That starts GitHub's DNS check.
2. At the DNS provider, point an apex domain with the A and AAAA records GitHub lists, or an ALIAS/ANAME record when the provider has one; point `www` or any other subdomain with a CNAME record to the Pages host (`<owner>.github.io`). The records are in the [GitHub Pages documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
3. Keep a `CNAME` file at the site root with only the host, such as example.org: no scheme, no path, no trailing slash. Jekyll copies it into `_site`, so it is in a classic branch build and in the Actions artifact.
4. In classic mode, still leave `url` and `baseurl` out; Pages fills them from the domain. In Actions mode, set `url` to the domain and leave `baseurl` out at the root:

```yaml
url: https://example.org
```

5. When the DNS check passes, ask the owner to turn on **Enforce HTTPS**. The certificate can take time to issue, and the option stays unavailable until it does.
6. Check the canonical link and the feed entries in the deployed page source: they use `url`, so a stale project host means the config still needs the domain.

## 6. Fix a failed deploy

| What you see | Cause | Fix |
| --- | --- | --- |
| The page has no styles and links 404 under the project path | The project site was built without `baseurl`, or a classic site still carries one | In Actions mode set `baseurl` to the repository name with a leading slash and remove an empty `--baseurl` flag; in classic mode remove `baseurl` |
| Styles and links name the project path on a custom domain | `baseurl` is still set | Remove `baseurl`; in Actions mode set `url` to the domain |
| The build fails while fetching the theme, or names its tag | The `remote_theme` pin names a tag that does not exist, `jekyll-remote-theme` is missing, or `theme` is also set | Pin a tag that exists in the theme's releases, or drop the pin; list `jekyll-remote-theme` under `plugins`; remove `theme` |
| The build names a plugin or says a gem is missing | Classic Pages runs only the plugins it ships, and ignores `_plugins/` | Remove the plugin, or move to Actions mode, add the gem to the `Gemfile`, and copy `_plugins/` |
| The build passes but the source map has no sections and no twins appear | The Pages gem loaded its safe-mode wrapper, so the site's `_plugins/` were skipped | Load the gem with `require: false` as in section 1, or set `JEKYLL_NO_BUNDLER_REQUIRE=1` in the build step |
| The build log names a file and a line | Invalid YAML, front matter, or Liquid in content | Fix that line; build locally again and read the first error only |
| Pages says no workflow has run, or serves an old commit | The Pages source and the workflow disagree, or the workflow watches another branch | Set the source to the branch or to GitHub Actions as you chose, and push to the branch the workflow names |
| The deploy job fails with a permission error | The workflow lacks `pages: write` or `id-token: write`, or the `github-pages` environment | Copy the permissions and environment from `.github/workflows/deploy-site.yml` |
| The custom domain is reported as improperly configured | DNS does not point at Pages, or `CNAME` has a scheme, a path, or the wrong host | Fix the records; put only the bare host in `CNAME`, then wait for the check |

## 7. Verify the deploy

1. Run the section 1 commands again. Fix every finding that names a file you changed, and stop when the doctor reports the same level or higher than the baseline.
2. Open the URL Settings, Pages reports. The home page loads with the theme's styles, and one subpage loads from its link.
3. In the page source, an asset URL starts with the project path on a project site, and with `/assets/` at a domain root. On a custom domain, the canonical link names the domain.
4. In Actions mode, open the latest run: the build must pass before the deploy, and the deploy job prints the deployed URL. In classic mode, read the Pages build log after the push.
5. If the doctor reports `doctor.root-links`, a Markdown link starts with `/` and skips the project path; follow the fix it prints.

## Never

- Never turn on Pages, pick its source, add a custom domain, change DNS, or enforce HTTPS yourself; ask the owner.
- Never commit or edit `_site`; the build replaces it.
- Never add `.nojekyll` to a classic Pages site: it turns Jekyll off, so the Markdown and front matter are served raw.
- Never add a plugin that classic Pages does not ship, and never expect `_plugins/` to run there.
- Never put a scheme, a path, or a trailing slash in `CNAME`; it holds the host only.
- Never set `baseurl` to a full URL or end it with a slash; `url` holds the scheme and host, `baseurl` the path.
