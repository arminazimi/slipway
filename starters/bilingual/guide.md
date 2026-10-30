---
title: Adding a translation
description: Copy a page, translate it, and link the two with translation_key.
layout: page
lang: en
translation_key: guide
permalink: /guide.html
---

Every translated page is a copy of the English page with translated text. The steps are the same for a new page and for a page that already exists.

1. Check that the language is in `slipway.languages` in `_config.yml`, with a `code`, a `name`, and a `prefix` such as `/fa`.
2. Copy the page into the folder named after the prefix, keeping the file name.
3. In the copy, set `lang` to the language code, set `permalink` to the address under the prefix, and keep the same `translation_key`.
4. Add the copy to that language's menu list, `main_fa` in `_data/navigation.yml`.

A Persian About page looks like this:

```markdown
---
title: دربارهٔ این قالب
description: قالب دو زبانه چه چیزی را نشان می‌دهد و تنظیم‌هایش کجاست.
layout: page
lang: fa
permalink: /fa/about.html
translation_key: about
---
```

The two pages now share the key `about`, so the switcher moves between them. Leave `direction` unset: the theme lays Persian out right to left from `lang`.
