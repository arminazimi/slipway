---
title: Configure
description: Change the look of the site with a few lines in _config.yml.
layout: doc
permalink: /guide/configure/
---

## Tokens

Tokens restyle the whole site. Each one maps to a CSS variable.

```yaml
slipway:
  tokens:
    radius: 0.75rem
```

## Languages

List each language with its URL prefix. The default language has an empty prefix.

```yaml
slipway:
  languages:
    - { code: en, name: English, prefix: "" }
```
