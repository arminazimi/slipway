---
title: About this starter
description: What the bilingual starter shows and where its settings live.
layout: page
lang: en
translation_key: about
permalink: /about.html
---

This starter is the smallest complete bilingual site: a landing page, this About page, and a [guide](/guide.html), each translated into Persian under `/fa/`.

The languages live in `_config.yml`:

```yaml
slipway:
  languages:
    - { code: en, name: English, prefix: "" }
    - { code: fa, name: فارسی, prefix: /fa }
```

Every page sets `lang` to its language and shares a `translation_key` with its translation. The switcher links the copies, and a page without a translation falls back to that language's home page.

The menus are separate lists in `_data/navigation.yml`: `main` for English and `main_fa` for Persian, so each language names its own pages.
