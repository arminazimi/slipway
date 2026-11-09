# Upgrading

This document lists changes in each minor release that require you to update your site's files when you upgrade.

## 0.3.0

0.3.0 replaces Jekyll with the Mizzen engine (`@velella/mizzen`) and the Lateen docs theme (`@velella/lateen`). Your Markdown, URLs, navigation, and the front matter the engine reads keep their meaning. Jekyll, the old theme, and the files they generated do not. The build runs on Node 24, so Ruby, the gem, and `remote_theme` are no longer part of a site.

You can stay on 0.2.0 while you move. Keep `remote_theme: arminazimi/slipway@v0.2.0`, or use the `legacy/jekyll` branch, which is the last Jekyll release. Neither gets new features.

### Before you start

- Commit or copy the site; the migration tool writes files.
- Install Node 24.
- Work from a checkout of the 0.3.0 release, where the migration tool is `tools/migrate/run.ts`.

### 1. Run the migration tool

Run it on a copy and read the report before it writes:

```bash
node tools/migrate/run.ts ../my-site --dry-run
node tools/migrate/run.ts ../my-site
```

On `examples/docs` from `legacy/jekyll` the dry run prints a report like this:

```
Slipway migration report
site: ../my-site
mode: dry run (nothing was written)

Would change (1)
  slipway.yml

Would remove (1)
  _config.yml

Manual steps (2)
  _config.yml — theme: names the theme that ships by default; slipway.yml needs no theme key
  _config.yml — plugins: Jekyll plugins; optional front matter, README indexes, redirects, the sitemap, and SEO tags are built in

Errors (0)
  none
```

The tool does three things:

- **Config.** Converts `_config.yml` to the new config, keeps comments on keys that survive, and lists every dropped key with its reason. It removes `_config.yml` only after the new file is valid.
- **Content.** Renames the front matter keys that changed (`layout`, `nav_order`, `direction`) and turns a standalone callout include into a `:::callout` directive. Every other Liquid tag or output stays where it is and is reported with its file and line.
- **Navigation.** Checks `_data/navigation.yml` against the engine's schema and reports each problem with its line. It never rewrites navigation, because a URL such as `docs/x` needs a person's decision.

It writes `slipway.yml`, the name from before the engine and theme were renamed. Rename it to `mizzen.yml`: that is the only config file 0.3.0 reads.

### 2. Remove the Jekyll machinery

Run steps 2 and 3 from the site root:

```bash
rm -rf _layouts _includes _plugins _site .jekyll-cache
rm -f Gemfile Gemfile.lock slipway-theme.gemspec .ruby-version _config.remote.yml
```

`_data/navigation.yml` stays: the engine reads the same shape. Remove copies of the old theme's CSS and JavaScript from `assets/`; keep the images and files your site owns.

### 3. Remove the files 0.3 now generates

The 0.2 theme generated these files; 0.3.0 generates the files it owns on every build. Delete the 0.2 copies:

```bash
find . -name '*.twin.html' -delete
rm -f search.json sitemap.xml llms.txt llms-full.txt sourcemap.json
```

A file in the site at the same path wins over a generated one, silently, so a copied 0.2 file hides the new output. Old twins also stop the build with `output.duplicate-path`. Keep one of these only when you intend to own that file.

### 4. Replace what the old theme provided

**Layouts.** The docs theme ships `base`, `doc`, `home`, and `not-found`. The tool renames `page` and `default` to `doc`; `base`, `doc`, `home`, and `not-found` keep their names. Every other 0.2 layout (`post`, `archive`, `author`, `tags`, `feed`, `adr`, `adr-index`, `changelog`, `changelog-feed`, `glossary`, `links`, `translation-status`) is removed: rewrite the page with the `doc` layout or without a layout. The 0.2 layouts that generated `llms.txt`, `llms-full.txt`, `search.json`, `sitemap.xml`, and `sourcemap.json` have no replacement page; delete those pages with step 3.

**Liquid and blocks.** The engine does not run Liquid. The tool converts the callout include; everything else it reports must become Markdown or a directive.

| 0.2 include | 0.3 |
| --- | --- |
| `blocks/callout.html` | `:::callout{type="tip"}` … `:::` |
| `blocks/steps.html` | `:::steps` around an ordered list |
| `blocks/code-group.html` | `:::code-tabs` |
| `blocks/file-tree.html` | `:::file-tree` |
| `blocks/terminal.html` | `:::terminal` |
| `blocks/figure.html` | `:::figure{src="…" alt="…"}` |
| `blocks/embed.html` | `::embed{src="…" title="…"}` |
| `blocks/endpoint.html` | `:::endpoint` |
| `blocks/kbd.html` | `:kbd[Ctrl+K]` |
| `blocks/badge.html` | `::badge{label="New"}` |

The remaining 0.2 blocks (annotations, audio, cards, chart, citation, compare, diff, download, gallery, hero, logos, people, pricing, pull-quote, stats, testimonial, timeline) have no one-line replacement. Rewrite them as Markdown or with a component in `packages/theme/components/`, or delete them when they were marketing blocks, which 0.3.0 removes.

**The home page.** The `home` layout reads `hero` (`eyebrow`, `title`, `lead`), `actions` (`label`, `url`, `primary`), and `sections` (`title`, `url`, `description`, `icon`, `links`) from front matter. The 0.2 `cta_text` and `cta_url` keys made one button and `variant` chose a look; move the call to action into `actions`, and drop `variant`.

**Overrides.** `_includes/head-custom.html`, `_includes/footer-custom.html`, `assets/css/custom.css`, and `assets/images/social.png` are not read by the engine in 0.3.0 ([docs/overrides.md](docs/overrides.md)). Remove them; move anything you still need into the page body or a theme component.

**Config and theme options.** A `slipway:` group dissolves: `languages` and `search` move to the top level, and `header`, `fonts`, `logo`, `tokens`, `analytics`, `persian`, and `arabic` move under `theme.options`. `comments`, `social`, `tokens.font_display`, `persian.jalali`, and `arabic.hijri` are dropped. `baseurl` becomes `base`, `defaults[].scope.path` becomes `defaults[].path`, and `permalink` is dropped because the file path gives the URL; a page that needs another URL sets `permalink`, and `redirects` covers the old one. The tool applies this and lists every dropped key.

### 5. Build and deploy

```bash
mizzen check .
mizzen build . --out dist
```

`check` builds to a temporary folder and prints diagnostics. `build` writes `dist`; change the folder with `--out`. From this repository, run the same commands from the repository root and name the site and the theme: `node packages/engine/bin/slipway.ts check ../my-site --theme packages/theme` and `node packages/engine/bin/slipway.ts build ../my-site --out dist --theme packages/theme`. The build fails on an unknown layout, an unknown config key, or two files writing the same path. Set `url` in `mizzen.yml` to publish a sitemap and canonical links.

Classic GitHub Pages cannot build a 0.3.0 site: Pages ran Jekyll, and 0.3.0 does not. Build on Node 24 in a workflow, publish the output folder (`dist`), and deploy it with the Pages actions; in the repository's Pages settings, the source is GitHub Actions, not a branch.

## 0.2.0

No change is required. A site built on 0.1.0 builds on 0.2.0 with the same `_config.yml`, front matter, and overrides, and no config key or front matter field was renamed (`schema/deprecations.json` is empty).

Two behaviors changed in ways you may notice:

- **One `h1` per page.** A page whose content starts with its own `#` heading no longer gets a second `h1` from the `doc` and `page` layouts, and a page without a `title` takes it from its first heading. If your CSS targeted the duplicate heading, remove that rule.
- **Search index.** Entries now keep the title, URL, headings, and a 300-character excerpt, and the index loads when the search field is first used. Add `search: false` to a page to leave it out. A site that copied `search.json` before 0.2.0 should copy the new one from `starter-files/`.

To pin this release, set `remote_theme: arminazimi/slipway@v0.2.0`.
