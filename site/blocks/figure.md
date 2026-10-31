---
title: Figure block
description: A responsive image with alt text, an optional caption, and an optional linked credit.
layout: page
figure:
  src: /assets/images/social.png
  alt: The Slipway social card
  caption: The Slipway social card, 1200 by 630 pixels.
  credit: Slipway
  credit_url: https://github.com/arminazimi/slipway
  width: 1200
  height: 630
figure_rtl:
  src: /assets/images/social.png
  alt: کارت اجتماعی اسلیپ‌وی
  caption: کارت اجتماعی اسلیپ‌وی، ۱۲۰۰ در ۶۳۰ پیکسل.
  credit: اسلیپ‌وی
  credit_url: https://github.com/arminazimi/slipway
  width: 1200
  height: 630
---

Images load lazily and decode asynchronously by default; pass `loading="eager"` or another value when a page needs it. Set `srcset` and `sizes` for responsive sources, and `credit_url` to link the credit.

## Left-to-right

{::nomarkdown}
{% include blocks/figure.html src=page.figure.src alt=page.figure.alt caption=page.figure.caption credit=page.figure.credit credit_url=page.figure.credit_url width=page.figure.width height=page.figure.height %}
{:/nomarkdown}

```liquid
{% raw %}{% include blocks/figure.html src=page.figure.src alt=page.figure.alt caption=page.figure.caption credit=page.figure.credit credit_url=page.figure.credit_url width=page.figure.width height=page.figure.height %}{% endraw %}
```

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/figure.html src=page.figure_rtl.src alt=page.figure_rtl.alt caption=page.figure_rtl.caption credit=page.figure_rtl.credit credit_url=page.figure_rtl.credit_url width=page.figure_rtl.width height=page.figure_rtl.height %}
</div>
{:/nomarkdown}

```html
{% raw %}<div dir="rtl">
  {% include blocks/figure.html src=page.figure_rtl.src alt=page.figure_rtl.alt caption=page.figure_rtl.caption credit=page.figure_rtl.credit credit_url=page.figure_rtl.credit_url width=page.figure_rtl.width height=page.figure_rtl.height %}
</div>{% endraw %}
```
