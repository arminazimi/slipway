---
title: Code group block
description: The same example in several languages or package managers, as tabs that stack without JavaScript.
layout: page
group:
  - label: npm
    language: bash
    code: |-
      npm install slipway
      npm run check
  - label: pnpm
    language: bash
    code: |-
      pnpm add slipway
      pnpm run check
  - label: Yarn
    language: bash
    code: |-
      yarn add slipway
      yarn check
group_rtl:
  - label: نصب با npm
    language: bash
    code: |-
      npm install slipway
  - label: نصب با pnpm
    language: bash
    code: |-
      pnpm add slipway
---

{::nomarkdown}
{% include component-css.html name="code-group" %}
{:/nomarkdown}

## Left-to-right

Pass a unique `id` when a page has more than one group, so the tabs of each group switch independently.

{::nomarkdown}
{% include blocks/code-group.html items=page.group id="code-group-ltr" %}
{:/nomarkdown}

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/code-group.html items=page.group_rtl id="code-group-rtl" %}
</div>
{:/nomarkdown}
