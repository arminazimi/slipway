---
title: افزودن ترجمه
description: صفحه را کپی کنید، ترجمه کنید و با translation_key به هم وصل کنید.
layout: page
lang: fa
permalink: /fa/guide.html
translation_key: guide
---

هر صفحهٔ ترجمه‌شده یک کپی از صفحهٔ انگلیسی است با متن ترجمه‌شده. مراحل برای صفحهٔ تازه و صفحهٔ موجود یکی است.

1. مطمئن شوید زبان در `slipway.languages` در `_config.yml` آمده است، با `code`، `name` و `prefix` مانند `/fa`.
2. صفحه را در پوشهٔ هم‌نام با پیشوند کپی کنید و نام فایل را نگه دارید.
3. در کپی، `lang` را به کد زبان، `permalink` را به نشانی زیر پیشوند و `translation_key` را همان قبلی بگذارید.
4. کپی را به فهرست منوی آن زبان، یعنی `main_fa` در `_data/navigation.yml`، اضافه کنید.

صفحهٔ «درباره» فارسی چنین است:

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

حالا هر دو صفحه کلید `about` را شریک‌اند و کلید زبان میانشان جابه‌جا می‌شود. `direction` را خالی بگذارید: قالب فارسی را از روی `lang` از راست به چپ می‌چیند.
