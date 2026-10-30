---
title: Pricing block
description: A row of plans with prices, features, and one highlighted plan.
layout: page
pricing:
  - name: Starter
    price: $0
    period: /month
    description: For side projects and experiments.
    features:
      - One site
      - Community support
    cta_label: Start free
    cta_url: /blocks/pricing.html
  - name: Pro
    price: $19
    period: /month
    description: For teams that publish often.
    features:
      - Unlimited sites
      - Priority support
      - Custom domains
    cta_label: Choose Pro
    cta_url: /blocks/pricing.html
    highlighted: true
    highlight_label: Most popular
  - name: Enterprise
    price: Custom
    features:
      - Everything in Pro
      - Single sign-on
      - Dedicated support
pricing_rtl:
  - name: شروع
    price: رایگان
    period: ماهانه
    description: برای پروژه‌های شخصی و آزمایشی.
    features:
      - یک سایت
      - پشتیبانی انجمن
    cta_label: شروع رایگان
    cta_url: /blocks/pricing.html
  - name: حرفه‌ای
    price: ۱۹ دلار
    period: ماهانه
    description: برای تیم‌هایی که زیاد منتشر می‌کنند.
    features:
      - سایت‌های نامحدود
      - پشتیبانی اولویت‌دار
      - دامنه‌های اختصاصی
    cta_label: انتخاب حرفه‌ای
    cta_url: /blocks/pricing.html
    highlighted: true
    highlight_label: محبوب‌ترین
  - name: سازمانی
    price: توافقی
    features:
      - همهٔ امکانات حرفه‌ای
      - ورود یکپارچه
      - پشتیبانی اختصاصی
---

{::nomarkdown}{% include component-css.html name="pricing" %}{:/nomarkdown}

## Left-to-right

{% include blocks/pricing.html id="pricing-plans" plans=page.pricing %}

## Right-to-left

<div dir="rtl">
{% include blocks/pricing.html plans=page.pricing_rtl %}
</div>
