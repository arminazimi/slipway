# `doctor.lang-mismatch`

A page's text should match the script expected by its `lang` attribute. The check reads the page's language from the built page's `<html lang>` through the build manifest when doctor is given `--build`; without an output it reads the page's front matter, its language URL prefix, the engine's `slipway.yml` `lang`, or `_config.yml` for a Jekyll site. When the dominant script of a page's text (e.g., Arabic) cannot be written in the page's `lang` (e.g., `en` which expects Latin), this check warns.

Short pages (under 200 letters), code blocks, and URLs are ignored.

## Why it matters for agents
An agent that translates a page into another language often forgets to update the page's `lang` field in the front matter. A mismatch between the declared language and the actual content's script affects accessibility (screen readers), font selection, and search engines.

## How to fix
Update the `lang` field in the page's front matter (or `slipway.yml`/`_config.yml` if the site is mono-lingual) to match the language of the translated text.

**Bad**
```markdown
---
title: راهنمای نصب
lang: en
---

این متن فارسی است اما زبان صفحه انگلیسی تعیین شده است.
```

**Good**
```markdown
---
title: راهنمای نصب
lang: fa
---

این متن فارسی است و زبان صفحه نیز فارسی تعیین شده است.
```
