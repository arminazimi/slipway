---
title: Steps block
description: A numbered sequence of steps, such as a tutorial or guide.
layout: page
steps:
  - title: Prerequisites
    description: Make sure you have installed the required tools.
  - title: Build
    url: /blocks/steps.html
    description: Run the build command to generate the output.
  - title: Deploy
steps_rtl:
  - title: پیش‌نیازها
    description: مطمئن شوید که ابزارهای مورد نیاز را نصب کرده‌اید.
  - title: ساخت
    url: /blocks/steps.html
    description: دستور ساخت را برای تولید خروجی اجرا کنید.
  - title: استقرار
---

{::nomarkdown}{% include component-css.html name="steps" %}{:/nomarkdown}

## Left-to-right

{% include blocks/steps.html steps=page.steps %}

## Right-to-left

<div dir="rtl">
{% include blocks/steps.html steps=page.steps_rtl %}
</div>
