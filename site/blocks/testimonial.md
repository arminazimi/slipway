---
title: Testimonial block
description: A quote from a customer, with their name, role, avatar, and source.
layout: page
testimonial:
  quote: Our writers publish a page in minutes now, without waiting for a developer to change the theme.
  name: Mina Rahimi
  role: Documentation lead, Example Co.
  avatar: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop
  avatar_alt: Portrait of Mina Rahimi
  source_url: https://example.com/reviews
  source_label: Example Co. review
testimonial_rtl:
  quote: نویسندگان ما حالا در چند دقیقه یک صفحه منتشر می‌کنند، بدون اینکه منتظر تغییر قالب توسط توسعه‌دهنده باشند.
  name: مینا رحیمی
  role: سرپرست مستندسازی، شرکت نمونه
  avatar: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop
  avatar_alt: تصویر مینا رحیمی
---

{::nomarkdown}{% include component-css.html name="testimonial" %}{:/nomarkdown}

## Quote only

{::nomarkdown}
{% include blocks/testimonial.html quote="A quote without a credit renders the figure and nothing else." %}
{:/nomarkdown}

## Left-to-right

{::nomarkdown}
{% include blocks/testimonial.html quote=page.testimonial.quote name=page.testimonial.name role=page.testimonial.role avatar=page.testimonial.avatar avatar_alt=page.testimonial.avatar_alt source_url=page.testimonial.source_url source_label=page.testimonial.source_label %}
{:/nomarkdown}

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/testimonial.html quote=page.testimonial_rtl.quote name=page.testimonial_rtl.name role=page.testimonial_rtl.role avatar=page.testimonial_rtl.avatar avatar_alt=page.testimonial_rtl.avatar_alt %}
</div>
{:/nomarkdown}
