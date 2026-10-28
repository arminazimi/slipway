---
title: Gallery block
description: A responsive grid of images with captions and credits.
layout: page
demo_images:
  - src: https://images.unsplash.com/photo-1682687220742-aba13b6e50ba
    alt: Mountains
    caption: A beautiful mountain range
    credit: Unsplash
    width: 800
    height: 600
    lazy: true
  - src: https://images.unsplash.com/photo-168268798150ce-658bc2ba0eb1
    alt: Desert
    caption: A vast desert landscape
    width: 800
    height: 600
    lazy: true
  - src: https://images.unsplash.com/photo-1682687981320-ee6f1a8e1003
    alt: Ocean
    credit: Unsplash
    width: 800
    height: 600
    lazy: true
demo_images_rtl:
  - src: https://images.unsplash.com/photo-1682687220742-aba13b6e50ba
    alt: کوه‌ها
    caption: یک رشته‌کوه زیبا
    credit: آن‌اسپلش
    width: 800
    height: 600
    lazy: true
  - src: https://images.unsplash.com/photo-168268798150ce-658bc2ba0eb1
    alt: صحرا
    caption: یک منظرهٔ وسیع صحرایی
    width: 800
    height: 600
    lazy: true
  - src: https://images.unsplash.com/photo-1682687981320-ee6f1a8e1003
    alt: اقیانوس
    credit: آن‌اسپلش
    width: 800
    height: 600
    lazy: true
---

{::nomarkdown}{% include component-css.html name="gallery" %}{:/nomarkdown}

## Left-to-right

{::nomarkdown}{% include blocks/gallery.html images=page.demo_images %}{:/nomarkdown}

## Right-to-left

<div dir="rtl">
{::nomarkdown}{% include blocks/gallery.html images=page.demo_images_rtl %}{:/nomarkdown}
</div>
