---
title: Compare block
description: A pros/cons pair or a feature matrix with yes, no, and partial.
layout: page
pros:
  - Fast and lightweight
  - Accessible out of the box
  - Uses standard JSON schema
cons:
  - No complex interactive logic
  - Limited to three statuses
headers:
  - Slipway
  - Framework A
  - Framework B
features:
  - label: Dark mode
    values: ["yes", "yes", "no"]
  - label: JavaScript optional
    values: ["yes", "no", "partial"]
  - label: Semantic HTML
    values: ["yes", "partial", "partial"]
---

## Pros and cons

{% include blocks/compare.html pros=page.pros cons=page.cons %}

## Feature Matrix

{% include blocks/compare.html headers=page.headers features=page.features %}
