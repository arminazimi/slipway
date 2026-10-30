---
title: Diff block
description: Before and after code, with removed and added lines marked by a sign as well as color.
layout: page
diff:
  caption: Change the server port
  language: yaml
  removed: |-
    server:
      port: 8080
  added: |-
    server:
      port: 9090
diff_rtl:
  caption: تغییر پورت سرور
  language: yaml
  removed: |-
    server:
      port: 8080
  added: |-
    server:
      port: 9090
---

{::nomarkdown}{% include component-css.html name="diff" %}{:/nomarkdown}

The author passes the old and new lines; the block does not work out the difference itself.

## Before and after

{% include blocks/diff.html caption=page.diff.caption language=page.diff.language removed=page.diff.removed added=page.diff.added %}

## One side

A side with no lines is skipped, so a block can show only the old or only the new code.

{% include blocks/diff.html language=page.diff.language removed=page.diff.removed %}

{% include blocks/diff.html language=page.diff.language added=page.diff.added %}

## Right-to-left

Code stays left to right; the caption follows the page direction.

<div dir="rtl">
{% include blocks/diff.html caption=page.diff_rtl.caption language=page.diff_rtl.language removed=page.diff_rtl.removed added=page.diff_rtl.added %}
</div>
