---
title: Timeline block
description: A timeline of dated events, such as a release history or project milestones.
layout: page
events:
  - date: 2026-11-23
    title: Phase 3 begins
    description: The third phase of the project starts with a focus on content and design.
  - date: 2026-12-01
    title: Timeline block implemented
    url: /blocks/timeline.html
    description: A new block was added to show chronological events easily.
  - date: 2026-12-20
    title: End of Phase 3
events_rtl:
  - date: 2026-11-23
    title: شروع فاز سوم
    description: فاز سوم پروژه با تمرکز بر محتوا و طراحی آغاز می‌شود.
  - date: 2026-12-01
    title: بلوک تایم‌لاین پیاده‌سازی شد
    url: /blocks/timeline.html
    description: یک بلوک جدید برای نمایش آسان رویدادهای زمانی اضافه شد.
  - date: 2026-12-20
    title: پایان فاز سوم
---

{::nomarkdown}{% include component-css.html name="timeline" %}{:/nomarkdown}

## Left-to-right

{% include blocks/timeline.html events=page.events %}

```liquid
{% raw %}{% include blocks/timeline.html events=page.events %}{% endraw %}
```

## Right-to-left

<div dir="rtl">
{% include blocks/timeline.html events=page.events_rtl %}
</div>

```html
{% raw %}<div dir="rtl">
  {% include blocks/timeline.html events=page.events_rtl %}
</div>{% endraw %}
```
