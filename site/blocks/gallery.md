---
title: Gallery block
description: A responsive grid of images with captions and credits.
layout: page
demo_images:
  - src: https://images.unsplash.com/photo-1682687220742-aba13b6e50ba
    alt: Mountains
    caption: A beautiful mountain range
    credit: Unsplash
    lazy: true
  - src: https://images.unsplash.com/photo-168268798150ce-658bc2ba0eb1
    alt: Desert
    caption: A vast desert landscape
    lazy: true
  - src: https://images.unsplash.com/photo-1682687981320-ee6f1a8e1003
    alt: Ocean
    credit: Unsplash
    lazy: true
demo_images_rtl:
  - src: https://images.unsplash.com/photo-1682687220742-aba13b6e50ba
    alt: کوه‌ها
    caption: یک رشته‌کوه زیبا
    credit: آن‌اسپلش
    lazy: true
  - src: https://images.unsplash.com/photo-168268798150ce-658bc2ba0eb1
    alt: صحرا
    caption: یک منظرهٔ وسیع صحرایی
    lazy: true
  - src: https://images.unsplash.com/photo-1682687981320-ee6f1a8e1003
    alt: اقیانوس
    credit: آن‌اسپلش
    lazy: true
---

{::nomarkdown}{% include component-css.html name="gallery" %}{:/nomarkdown}

## Left-to-right

{% include blocks/gallery.html images=page.demo_images %}

## Right-to-left

<div dir="rtl">
{% include blocks/gallery.html images=page.demo_images_rtl %}
</div>
