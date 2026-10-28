---
title: Timeline block
description: A timeline of dated events, such as a release history or project milestones.
layout: page
---

## Left-to-right

{% capture timeline_events %}
- date: 2026-11-23
  title: Phase 3 begins
  description: The third phase of the project starts with a focus on content and design.
- date: 2026-12-01
  title: Timeline block implemented
  url: /blocks/timeline/
  description: A new block was added to show chronological events easily.
- date: 2026-12-20
  title: End of Phase 3
{% endcapture %}
{% assign events_data = timeline_events | from_yaml %}

{% include blocks/timeline.html events=events_data %}


## Right-to-left

<div dir="rtl">
{% capture timeline_events_rtl %}
- date: 2026-11-23
  title: شروع فاز سوم
  description: فاز سوم پروژه با تمرکز بر محتوا و طراحی آغاز می‌شود.
- date: 2026-12-01
  title: بلوک تایم‌لاین پیاده‌سازی شد
  url: /blocks/timeline/
  description: یک بلوک جدید برای نمایش آسان رویدادهای زمانی اضافه شد.
- date: 2026-12-20
  title: پایان فاز سوم
{% endcapture %}
{% assign events_data_rtl = timeline_events_rtl | from_yaml %}

{% include blocks/timeline.html events=events_data_rtl %}
</div>
