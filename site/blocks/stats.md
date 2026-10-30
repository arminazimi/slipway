---
title: Stat tiles block
description: A row of key numbers with labels and optional trend.
layout: page
demo_stats_1:
  - label: Rules
    value: 516
  - label: Ecosystems
    value: 14
demo_stats_2:
  - label: Users
    value: 10
    unit: K
    trend: +5%
  - label: Revenue
    value: 2.5
    unit: M
    trend: +12%
  - label: Churn
    value: 1.2
    unit: "%"
    trend: -0.5%
demo_stats_rtl:
  - label: قواعد
    value: ۵۱۶
  - label: بوم‌سازگان
    value: ۱۴
  - label: کاربران
    value: ۱۰
    unit: هزار
    trend: +۵٪
---

{::nomarkdown}{% include component-css.html name="stats" %}{:/nomarkdown}

## Left-to-right

### Basic

{% include blocks/stats.html items=page.demo_stats_1 %}

```liquid
{% raw %}{% include blocks/stats.html items=page.demo_stats_1 %}{% endraw %}
```

### With Units and Trends

{% include blocks/stats.html items=page.demo_stats_2 %}

```liquid
{% raw %}{% include blocks/stats.html items=page.demo_stats_2 %}{% endraw %}
```

## Right-to-left

<div dir="rtl">
{% include blocks/stats.html items=page.demo_stats_rtl %}
</div>

```html
{% raw %}<div dir="rtl">
  {% include blocks/stats.html items=page.demo_stats_rtl %}
</div>{% endraw %}
```
