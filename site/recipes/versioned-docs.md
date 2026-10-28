---
title: Versioned documentation on GitHub Pages (folders per version)
description: Publish /v1/, /v2/, and /latest/ from one repository, with a version switcher using navigation data.
layout: doc
---

This recipe shows how to host multiple versions of your documentation (like `/v1/`, `/v2/`, and `/latest/`) from a single repository using GitHub Pages.

**Mode needed:** Classic mode or Actions mode.

## Approach

1. Create a folder for each version of your documentation (e.g., `v1`, `v2`).
2. Inside each folder, place the corresponding Markdown files.
3. Configure `_data/navigation.yml` with version items or use separate navigation files per version if needed.
4. Update links in your `_config.yml` or navigation to point to the desired versions.

## Example Configuration

```yaml
main:
  - title: Latest Docs (v2)
    url: /latest/
  - title: Version 1 (v1)
    url: /v1/
```

You can read the official [GitHub Pages documentation](https://docs.github.com/en/pages) for details on how the file system maps to URLs.

By organizing your files into version-specific subdirectories, Jekyll will output them exactly in that structure, and you can build a standard Slipway navigation layout to let users jump between `/v1/` and `/latest/`.
