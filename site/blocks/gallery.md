---
title: Gallery block
description: A responsive grid of images with captions and credits.
layout: page
demo_images:
  - src: https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=600&fit=crop
    alt: Mountains
    caption: A beautiful mountain range
    credit: Unsplash
    width: 800
    height: 600
    lazy: true
  - src: https://images.unsplash.com/photo-168268798150ce-658bc2ba0eb1?w=800&h=600&fit=crop
    alt: Desert
    caption: A vast desert landscape
    width: 800
    height: 600
    lazy: true
  - src: https://images.unsplash.com/photo-1682687981320-ee6f1a8e1003?w=800&h=600&fit=crop
    alt: Ocean
    credit: Unsplash
    width: 800
    height: 600
    lazy: true
demo_images_rtl:
  - src: https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=600&fit=crop
    alt: کوه‌ها
    caption: یک رشته‌کوه زیبا
    credit: آن‌اسپلش
    width: 800
    height: 600
    lazy: true
  - src: https://images.unsplash.com/photo-168268798150ce-658bc2ba0eb1?w=800&h=600&fit=crop
    alt: صحرا
    caption: یک منظرهٔ وسیع صحرایی
    width: 800
    height: 600
    lazy: true
  - src: https://images.unsplash.com/photo-1682687981320-ee6f1a8e1003?w=800&h=600&fit=crop
    alt: اقیانوس
    credit: آن‌اسپلش
    width: 800
    height: 600
    lazy: true
---

## Left-to-right

{::nomarkdown}
{% include blocks/gallery.html images=page.demo_images %}
{:/nomarkdown}

```liquid
{% raw %}{% include blocks/gallery.html images=page.demo_images %}{% endraw %}
```

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/gallery.html images=page.demo_images_rtl %}
</div>
{:/nomarkdown}

```html
{% raw %}<div dir="rtl">
  {% include blocks/gallery.html images=page.demo_images_rtl %}
</div>{% endraw %}
```
