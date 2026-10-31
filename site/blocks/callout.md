---
title: Callout block
description: A short note, tip, warning, or danger message with an icon that stays at the reading start in both directions.
layout: page
note_body: Remember to run the tests before you open a pull request.
tip_body: Save the file before you run the build to pick up your changes.
warning_body: This option changes the output of every page on the site.
danger_body: Deleting the folder cannot be undone.
note_rtl: پیش از باز کردن درخواست ادغام، آزمون‌ها را اجرا کنید.
tip_rtl: پیش از ساخت، فایل را ذخیره کنید تا تغییرها اعمال شوند.
warning_rtl: این گزینه خروجی همهٔ صفحه‌های سایت را تغییر می‌دهد.
danger_rtl: حذف این پوشه برگشت‌پذیر نیست.
---

{::nomarkdown}{% include component-css.html name="callout" %}{:/nomarkdown}

## Left-to-right

### Note (default)

{% include blocks/callout.html body=page.note_body %}

```liquid
{% raw %}{% include blocks/callout.html body=page.note_body %}{% endraw %}
```

### Tip

{% include blocks/callout.html type="tip" title="Tip" body=page.tip_body %}

```liquid
{% raw %}{% include blocks/callout.html type="tip" title="Tip" body=page.tip_body %}{% endraw %}
```

### Warning

{% include blocks/callout.html type="warning" body=page.warning_body %}

```liquid
{% raw %}{% include blocks/callout.html type="warning" body=page.warning_body %}{% endraw %}
```

### Danger

{% include blocks/callout.html type="danger" title="Danger" body=page.danger_body %}

```liquid
{% raw %}{% include blocks/callout.html type="danger" title="Danger" body=page.danger_body %}{% endraw %}
```

### Unknown type

An unknown `type` falls back to `note`:

{% include blocks/callout.html type="info" title="Note" body=page.note_body %}

```liquid
{% raw %}{% include blocks/callout.html type="info" title="Note" body=page.note_body %}{% endraw %}
```

## Right-to-left

<div dir="rtl">
{% include blocks/callout.html body=page.note_rtl %}
{% include blocks/callout.html type="tip" title="نکته" body=page.tip_rtl %}
{% include blocks/callout.html type="warning" title="هشدار" body=page.warning_rtl %}
{% include blocks/callout.html type="danger" title="خطر" body=page.danger_rtl %}
</div>

```html
{% raw %}<div dir="rtl">
  {% include blocks/callout.html body=page.note_rtl %}
  {% include blocks/callout.html type="tip" title="نکته" body=page.tip_rtl %}
  {% include blocks/callout.html type="warning" title="هشدار" body=page.warning_rtl %}
  {% include blocks/callout.html type="danger" title="خطر" body=page.danger_rtl %}
</div>{% endraw %}
```

The accent border and the padding use `border-inline-start` and `padding-inline-start`, and the icon is the first item in a direction-aware flex row, so the marker sits at the reading start on both sides of the page. The icons themselves are symmetric, so they need no flip.
