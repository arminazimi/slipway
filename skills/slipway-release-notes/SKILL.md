---
name: slipway-release-notes
description: Write a changelog entry and a release page from merged pull requests, for a site built with Slipway or for Slipway itself.
metadata:
  version: "0.3.0"
---

# Write a changelog entry and release notes

Use this Skill when a version is about to ship or has just shipped and its pull requests are merged. It produces two texts for two readers: the changelog entry, the complete record for people upgrading, and the release page, the short announcement for people deciding whether to. Write both from the same list of pull requests, so they cannot disagree.

In the Slipway repository the changelog entry is a fragment in `changelog.d/`; on a site it is a section in a normal Markdown page. The release page is a normal page too: the engine has no posts, so it needs no date or post folder. Sections 4 and 5 say where each file goes.

## 1. Take a baseline

From the site folder, check the site before you change anything, and keep the output:

```sh
slipway check .
slipway build . --out dist
```

Your work is done when the check and the build add no problem and no diagnostic. In the Slipway repository, run `npm run check` after the edit. `slipway` is the engine's command line; until it is installed, say so and do not invent a result.

## 2. Collect the merged pull requests

List them with their number, title, merge date, labels, and author:

```sh
gh pr list --state merged --base main --limit 100 --json number,title,mergedAt,labels,author
```

Authenticate once with `gh auth status`. Start at the last release: `gh release list --limit 1` gives its tag, and every pull request merged after that tag belongs to this release; with no release yet, use all of them. In the Slipway repository the tags are `mizzen-v*` and `lateen-v*`. A title is a summary, not a description: open the pull request when it does not say what a reader gains, and read its body. Read `CHANGELOG.md` and the existing `changelog.d/` fragments first, so a feature keeps its name and a change that shipped does not appear twice.

## 3. Sort the changes

Group them under the Keep a Changelog headings, in this order, and leave out the empty ones: Added, Changed, Deprecated, Removed, Fixed, Security. A change that breaks a site is Changed, and it also gets upgrade notes: an entry in `UPGRADING.md` in the Slipway repository (the old form, the new form, and the fix), or the steps in the release page's Upgrading section on a site.

Write one line per change a site owner would notice. Use the present tense and the imperative (Add, Fix, not Added, Fixes), one sentence, and end with the pull request number: `(#123)`. Name what the reader sees, not the internal module: "Search finds Persian pages typed with Arabic letters", not "Normalize the search key". Leave out what a site owner cannot act on: tests, refactors, CI, dependency bumps with no behavior change, and typo fixes in old pages.

A security fix goes under Security without the exploit details, and it stays out of the release page until the version that contains it is out. Never name a private issue or a reporter without their consent.

## 4. Write the changelog entry

In the Slipway repository, add one fragment per pull request a site owner would notice, named after its issue or pull request: `changelog.d/<issue>.md`, one line ([changelog.d/README.md](https://github.com/arminazimi/slipway/blob/main/changelog.d/README.md)):

```markdown
Search finds Persian pages typed with Arabic letters (#229).
```

Never edit `CHANGELOG.md` in the Slipway repository: parallel pull requests would conflict on it. At release time a maintainer runs `node tools/release/prepare.ts <version>`: it prints the plan by default, and with `--write` it moves `Unreleased` and the fragments into a dated section, deletes the fragments, and bumps the versions ([CONTRIBUTING.md](https://github.com/arminazimi/slipway/blob/main/CONTRIBUTING.md), "Releasing"). Do not run it, commit its output, or push a tag unless a maintainer asked you to; publishing is theirs.

On a site, add the same lines under `## [Unreleased]` in the changelog page, newest version first. The page is a normal Markdown page with the theme's default layout; it needs no special layout key. Do not create `changelog.d/` or run the release tool in a site repository. A site with no changelog page keeps the record in the release page; do not add a page for one release unless the owner asks.

## 5. Write the release page

The page is a file such as `releases/0-3-0.md`, with the URL `/releases/0-3-0/`. Its front matter:

```yaml
---
title: Slipway 0.3.0
description: Faster search, a changelog page, and the fixes from this release.
---
```

The title is the page's `h1`, so start sections at `##`. Do not use `post`, a date in the file name, `tags`, `categories`, or `author`: the engine has no posts, and a release is a normal page. Write the release date in the opening paragraph, such as "Released on 2026-11-09.", and set `last_modified_at` after a substantial edit if the site shows it.

A shape that works:

- `## Highlights`: three bullets at most, each a change a reader can act on.
- `## Added`, `## Changed`, `## Fixed`, `## Security`: the same lines as the changelog, each linked to its pull request.
- `## Upgrading`: the command or config line that moves a reader to the new version, and the steps or `UPGRADING.md` entry for a breaking change.

Link a change to its pull request as `[#123](https://github.com/<owner>/<repo>/pull/123)`, and link the full changelog page once. Do not paste the whole changelog into the page: say what matters to a reader and point at the rest. Plain Markdown only, and give every code block a language.

An unfinished page stays out of the build with `published: false`; there is no drafts folder.

## 6. Check the two files

From the site folder:

```sh
slipway check .
slipway build . --out dist
```

Read every diagnostic and fix the ones that name a file; each one names its line. Then compare the result with the baseline from section 1: the page and the changelog line must add none. In the Slipway repository, `npm run check` is the same gate.

Then read the built release page: the title, the date line, and every link. Check that the version is the same in the title, in the upgrade line, and in the changelog.

## Never

- Never edit `CHANGELOG.md` in the Slipway repository; add a fragment. Never run the release tool, commit its output, or push a tag unless a maintainer asked; a release is merged, tagged, and published by them.
- Never announce a pull request that is not merged, or a change the diff does not contain.
- Never put template syntax in a page, and never add a second `h1` or skip a heading level.
- Never create a dated post, a drafts folder, or a blog layout; posts are not part of the engine.
- Never rename or move a published page to change its date or title; set `title`.
- Never publish a security fix before the release that contains it, or a private issue number.
