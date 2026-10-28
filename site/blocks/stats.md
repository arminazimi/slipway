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
---

{::nomarkdown}{% include component-css.html name="stats" %}{:/nomarkdown}

## Basic

{% include blocks/stats.html items=page.demo_stats_1 %}

## With Units and Trends

{% include blocks/stats.html items=page.demo_stats_2 %}