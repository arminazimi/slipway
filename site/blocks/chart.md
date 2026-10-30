---
title: Chart block
description: A bar chart drawn in CSS from labelled numbers, with the data table as the fallback.
layout: page
chart:
  - label: Slipway
    value: 48
  - label: Seaworthy
    value: 32
  - label: Other tools
    value: 20
chart_rtl:
  - label: اسلیپ‌وی
    value: 48
  - label: سی‌ورثی
    value: 32
  - label: ابزارهای دیگر
    value: 20
---

{::nomarkdown}
{% include component-css.html name="chart" %}
{:/nomarkdown}

## Left-to-right

{::nomarkdown}
{% include blocks/chart.html data=page.chart caption="Projects by downloads" %}
{:/nomarkdown}

## Fixed maximum

Pass `max` to compare every bar against the same scale instead of the largest value:

{::nomarkdown}
{% include blocks/chart.html data=page.chart caption="Projects by downloads, out of 100" max=100 %}
{:/nomarkdown}

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/chart.html data=page.chart_rtl caption="پروژه‌ها بر اساس دانلود" %}
</div>
{:/nomarkdown}

## Data

Keep the list in `_data/chart.yml` and pass the file instead of front matter:

```yaml
- label: Slipway
  value: 48
- label: Seaworthy
  value: 32
```

```liquid
{% raw %}{% include blocks/chart.html data=site.data.chart %}{% endraw %}
```

Every row is a `label` and a numeric `value`; `caption` and `max` are optional. The table is the chart: without CSS it still reads as a table, and it needs no JavaScript.
