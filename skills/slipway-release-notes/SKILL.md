---
name: slipway-release-notes
description: Write a release post and a changelog entry from merged pull requests, for a site built with Slipway or for the Slipway theme itself.
metadata:
  version: "0.2.0"
---

# Write a release post and a changelog entry

Use this skill when a version is about to ship or has just shipped and its pull requests are merged. It produces two texts for two readers: the changelog entry, the complete record for people upgrading, and the release post, the short announcement for people deciding whether to. Write both from the same list of pull requests, so they cannot disagree.

In the Slipway repository the changelog entry is a fragment in `changelog.d/`; on a site it is a line in the page that has `layout: changelog`. The release post is a normal `post` page on the site. Sections 4 and 5 say where each file goes.

## 1. Take a baseline

From the root of the theme repository (the [Content skill](https://github.com/arminazimi/slipway/blob/main/skills/slipway-content/SKILL.md) shows the one-time clone), check the site's config, front matter, and output before you change anything, and keep the output:

```sh
node tools/theme/validate.mjs <site>
node packages/doctor/bin/slipway.mjs doctor <site> --build <site>/_site
```

Pass the site folder; build it first when its output is missing or older than its source (section 6). Your work is done when the two checks add no problem and no finding.

## 2. Collect the merged pull requests

List them with their number, title, merge date, labels, and author:

```sh
gh pr list --state merged --base main --limit 100 --json number,title,mergedAt,labels,author
```

Authenticate once with `gh auth status`. Start at the last release: `gh release list --limit 1` gives its tag, and every pull request merged after that tag belongs to this release; with no release yet, use all of them. A title is a summary, not a description: open the pull request when it does not say what a reader gains, and read its body. In the Slipway repository, read `CHANGELOG.md` and the existing `changelog.d/` fragments first, so a feature keeps its name and a change that shipped does not appear twice.

## 3. Sort the changes

Group them under the Keep a Changelog headings, in this order, and leave out the empty ones: Added, Changed, Deprecated, Removed, Fixed, Security. A change that breaks a site is Changed, and it also gets upgrade notes: an entry in `UPGRADING.md` in the Slipway repository (the old form, the new form, and the fix), or the steps in the post's Upgrading section on a site.

Write one line per change a site owner would notice. Use the present tense and the imperative (Add, Fix, not Added, Fixes), one sentence, and end with the pull request number: `(#123)`. Name what the reader sees, not the internal module: "Search finds Persian pages typed with Arabic letters", not "Normalize the search key". Leave out what a site owner cannot act on: tests, refactors, CI, dependency bumps with no behavior change, and typo fixes in old posts.

A security fix goes under Security without the exploit details, and it stays out of the release post until the version that contains it is out. Never name a private issue or a reporter without their consent.

## 4. Write the changelog entry

In the Slipway repository, add one fragment per pull request a site owner would notice, named after its issue or pull request: `changelog.d/<issue>.md`, one line ([changelog.d/README.md](https://github.com/arminazimi/slipway/blob/main/changelog.d/README.md)):

```markdown
Search finds Persian pages typed with Arabic letters (#229).
```

Never edit `CHANGELOG.md` in the Slipway repository: parallel pull requests would conflict on it. At release time a maintainer runs `node tools/release/prepare.mjs <version>`: it moves `Unreleased` and the fragments into a dated section, deletes the fragments, bumps the gemspec and the lockfiles, and prints the git commands ([CONTRIBUTING.md](https://github.com/arminazimi/slipway/blob/main/CONTRIBUTING.md), "Releasing"). Do not run it, commit its output, or push a tag unless a maintainer asked you to; publishing is theirs.

On a site, add the same lines under `## [Unreleased]` in the Markdown page with `layout: changelog`, newest version first; [the changelog fixture](https://github.com/arminazimi/slipway/blob/main/tools/theme/fixtures/changelog/index.md) shows the form. Do not create `changelog.d/` or run the release script in a repository that does not have them. A site with no changelog page keeps the record in the release post; do not add a page for one release unless the owner asks.

## 5. Write the release post

The post is a dated file in the site's `_posts/<date>-<slug>.md`; the date comes from the file name, and the address from it too unless the post sets `permalink`. `examples/blog/_posts/2026-10-20-why-plain-markdown.md` shows the format, and every key is in [the front matter reference](https://github.com/arminazimi/slipway/blob/main/skills/slipway-content/reference/front-matter.md). A version post:

```yaml
title: Slipway 0.2.0
description: Faster search, a changelog page, and the fixes from this release.
layout: post
toc: true
author: ada
tags: [release, notes]
categories: [releases]
```

`title` names the version; `description` is one sentence for the feed, search, and link previews; `toc` adds a table of contents to a long post; `author` is a key of `_data/authors.yml`; `tags` and `categories` are lists. Leave `permalink` out unless the site sets one for every post. A post dated in the future is built and published on that date, not before; keep an unfinished post in `_drafts/<slug>.md`, which GitHub Pages does not build. Never rename a post after it is published: set `title`, and add `updated: YYYY-MM-DD` after a substantial edit.

The body uses `##` sections only, since the title is the h1. A shape that works:

- `## Highlights`: three bullets at most, each a change a reader can act on.
- `## Added`, `## Changed`, `## Fixed`, `## Security`: the same lines as the changelog, each linked to its pull request.
- `## Upgrading`: the command or config line that moves a reader to the new version (for Slipway, the version in `remote_theme`), and the steps or `UPGRADING.md` entry for a breaking change.

Link a change to its pull request as `[#123](https://github.com/<owner>/<repo>/pull/123)`, and link the full changelog page once. Do not paste the whole changelog into the post: say what matters to a reader and point at the rest. Plain Markdown only, no Liquid, and give every code block a language.

## 6. Check the two files

In the site folder, build the output the doctor reads:

```sh
bundle exec jekyll build
```

When the site keeps `sourcemap.json` or Markdown twins in its repository, regenerate them first with `npm run sourcemap -- <site>` and `npm run twins -- <site>`, so the doctor checks the new post instead of a stale map.

Then, from the root of the theme repository:

```sh
node tools/theme/validate.mjs <site>
node packages/doctor/bin/slipway.mjs doctor <site> --build <site>/_site
```

`validate.mjs` prints each problem as `file:line key: message (allowed: ...)`; fix it at that line and run it again. Read every error and warning in the build and fix the ones that name a file. The doctor checks the source and the built post: a finding that names your file is yours. Compare all three with the baseline from section 1; the post and the changelog line must add none.

Then read the built post in the output folder: the date, the byline, the tags, and every link. Check that the version is the same in the title, in the upgrade line (for Slipway, `remote_theme`), and in the changelog.

## Never

- Never edit `CHANGELOG.md` in the Slipway repository; add a fragment. Never run `node tools/release/prepare.mjs <version>`, commit its output, or push a tag unless a maintainer asked; a release is merged, tagged, and published by them.
- Never announce a pull request that is not merged, or a change the diff does not contain.
- Never put Liquid in a post, and never add a second h1 or skip a heading level.
- Never rename or move a published post to change its date or title; set `title`, and `updated` after a substantial edit.
- Never publish a security fix before the release that contains it, or a private issue number.
