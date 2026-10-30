---
title: Annotations block
description: A code sample with numbered markers and a note for each number.
layout: page
annotations:
  caption: Debouncing a search request.
  language: javascript
  code: |-
    const results = debounce(async (query) => { // 1
      const response = await fetch(`/api/search?q=${query}`); // 2
      return response.json(); // 3
    }, 300); // 4
  notes:
    - text: debounce waits until typing stops before it calls the function.
    - text: The request uses the latest query, so one runs per pause.
    - text: The parsed JSON goes back to the caller.
    - text: 300 milliseconds is how long the typing must stop.
annotations_rtl:
  caption: جست‌وجوی تأخیردار
  language: javascript
  code: |-
    const results = debounce(async (query) => { // 1
      const response = await fetch(`/api/search?q=${query}`); // 2
      return response.json(); // 3
    }, 300); // 4
  notes:
    - debounce اجرای تابع را تا توقف تایپ به تعویق می‌اندازد.
    - درخواست با آخرین عبارت جست‌وجو فرستاده می‌شود.
    - پاسخ JSON به فراخواننده برگردانده می‌شود.
    - ۳۰۰ میلی‌ثانیه مدت توقف پیش از اجرای جست‌وجو است.
---

{::nomarkdown}{% include component-css.html name="annotations" %}{:/nomarkdown}

The numbers are part of the code: type a marker such as `// 1` where the note applies, and write the notes in the same order. The block does not add or renumber them, so the code reads the same as it would in an editor. When a page shows the block twice, pass a different `id_prefix` to each copy so the note ids stay unique.

## Left-to-right

{% include blocks/annotations.html caption=page.annotations.caption language=page.annotations.language code=page.annotations.code notes=page.annotations.notes %}

## Right-to-left

<div dir="rtl">
{% include blocks/annotations.html id_prefix="sl-annotation-rtl" caption=page.annotations_rtl.caption language=page.annotations_rtl.language code=page.annotations_rtl.code notes=page.annotations_rtl.notes %}
</div>
