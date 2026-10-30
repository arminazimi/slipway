---
title: Compare block
description: A pros/cons pair or a feature matrix with yes, no, and partial.
layout: page
pros:
  - Fast and lightweight
  - Accessible out of the box
  - Uses standard JSON schema
cons:
  - No complex interactive logic
  - Limited to three statuses
headers:
  - Slipway
  - Framework A
  - Framework B
features:
  - label: Dark mode
    values: ["yes", "yes", "no"]
  - label: JavaScript optional
    values: ["yes", "no", "partial"]
  - label: Semantic HTML
    values: ["yes", "partial", "partial"]
pros_rtl:
  - سریع و سبک
  - دسترس‌پذیر از همان ابتدا
  - از طرح‌واره استاندارد JSON استفاده می‌کند
cons_rtl:
  - بدون منطق تعاملی پیچیده
  - محدود به سه وضعیت
---

{::nomarkdown}{% include component-css.html name="compare" %}{:/nomarkdown}

## Left-to-right

### Pros and cons

{% include blocks/compare.html pros=page.pros cons=page.cons %}

```liquid
{% raw %}{% include blocks/compare.html pros=page.pros cons=page.cons %}{% endraw %}
```

### Feature Matrix

{% include blocks/compare.html headers=page.headers features=page.features %}

```liquid
{% raw %}{% include blocks/compare.html headers=page.headers features=page.features %}{% endraw %}
```

## Right-to-left

<div dir="rtl">
{% include blocks/compare.html pros=page.pros_rtl cons=page.cons_rtl %}
</div>

```html
{% raw %}<div dir="rtl">
  {% include blocks/compare.html pros=page.pros_rtl cons=page.cons_rtl %}
</div>{% endraw %}
```
