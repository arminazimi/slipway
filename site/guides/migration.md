---
title: "Migrate an Existing Jekyll Site to Slipway"
layout: doc
description: "A guide to switching an existing Jekyll site to Slipway, keeping permalinks and mapping front matter."
---

# Migrate an Existing Jekyll Site to Slipway

Switching an existing Jekyll site to Slipway allows you to take advantage of agent-native features, RTL support, and Seaworthy validation. This guide walks you through migrating your site while keeping your existing URLs (permalinks) and mapping your front matter.

## 1. Update your configuration

First, change the theme in your `_config.yml`. If you are using GitHub Pages, switch to the `remote_theme`:

```yaml
remote_theme: arminazimi/slipway
plugins:
  - jekyll-remote-theme
```

If you are using a standard Ruby environment, add the gem to your `Gemfile`:

```ruby
gem "slipway-theme"
```

And update your `_config.yml`:

```yaml
theme: slipway-theme
```

Remove any configurations related to your old theme (e.g., legacy navigation settings or old plugin lists). Ensure you have a `title` and `lang` (e.g., `lang: en`) set in `_config.yml`.

## 2. Keep your existing permalinks

To ensure your existing URLs do not break, you can explicitly set the `permalink` field in the front matter of your pages and posts. Slipway supports Jekyll's built-in `permalink` rules.

For example, if your old about page was available at `/about-us/`, add the `permalink` to its front matter:

```yaml
---
title: "About Us"
permalink: /about-us/
---
```

Use explicit `permalink` front matter (e.g. `permalink: /path/`) on Jekyll Markdown pages to ensure correct directory-style URL resolution without relying on global permalink settings.

## 3. Map your front matter

Slipway relies on strict JSON Schemas for front matter to ensure content is agent-editable. Update the front matter of your pages and posts to match Slipway's schemas:

- **`title`**: Every page must have a `title`.
- **`layout`**: Update the `layout` key to one of Slipway's supported layouts:
  - `page` or `default` for standard pages.
  - `post` for blog posts in `_posts/`.
  - `doc` for documentation pages in `_docs/`.
  - `home` for the homepage.
  - `archive`, `tags`, or `author` for taxonomy and author pages.
- **`description`** (Optional): Add a one-sentence description for search results and link previews.

Example of an updated post front matter:

```yaml
---
title: "My First Post on Slipway"
layout: post
description: "A quick look at migrating to the Slipway theme."
tags: [migration, update]
---
```

## 4. Set up navigation

Slipway uses a central data file for navigation instead of front matter flags or legacy config settings.

Create a `_data/navigation.yml` file and list your menu items:

```yaml
items:
  - title: Home
    url: /
  - title: About
    url: /about-us/
  - title: Blog
    url: /blog/
```

This will automatically populate the main navigation bar.

## 5. Verify your site

Once you have updated your files, test the site locally or push to a branch. To verify that your migration was successful and that your site is now agent-friendly, run `slipway doctor`.

Review any warnings about missing front matter or deprecated keys and fix them based on the provided source lines.
