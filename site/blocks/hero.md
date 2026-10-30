---
title: Hero block
description: A headline, a lead, two actions, and an optional image.
layout: page
hero:
  id: hero-demo
  title: A site that people and agents can edit
  lead: Slipway keeps every page small, semantic, and readable in both directions.
  primary_url: /install/
  primary_label: Install Slipway
  secondary_url: /guides/
  secondary_label: Read the guides
  image: /assets/images/social.png
  image_alt: The Slipway social card
hero_rtl:
  id: hero-demo-rtl
  title: سایتی که انسان‌ها و ایجنت‌ها می‌توانند ویرایش کنند
  lead: اسلیپ‌وی هر صفحه را کوچک، معنایی و خوانا نگه می‌دارد.
  primary_url: /install/
  primary_label: نصب اسلیپ‌وی
  secondary_url: /guides/
  secondary_label: خواندن راهنماها
  image: /assets/images/social.png
  image_alt: تصویر اجتماعی اسلیپ‌وی
---

{::nomarkdown}{% include component-css.html name="hero" %}{:/nomarkdown}

## Left-to-right

{::nomarkdown}
{% include blocks/hero.html id=page.hero.id title=page.hero.title lead=page.hero.lead primary_url=page.hero.primary_url primary_label=page.hero.primary_label secondary_url=page.hero.secondary_url secondary_label=page.hero.secondary_label image=page.hero.image image_alt=page.hero.image_alt %}
{:/nomarkdown}

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/hero.html id=page.hero_rtl.id title=page.hero_rtl.title lead=page.hero_rtl.lead primary_url=page.hero_rtl.primary_url primary_label=page.hero_rtl.primary_label secondary_url=page.hero_rtl.secondary_url secondary_label=page.hero_rtl.secondary_label image=page.hero_rtl.image image_alt=page.hero_rtl.image_alt %}
</div>
{:/nomarkdown}
