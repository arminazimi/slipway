---
title: Audio block
description: A native audio player for podcast episodes, with optional chapters and a transcript.
layout: page
audio:
  src: audio/podcast-episode-12.mp3
  title: Building with blocks, episode 12
  chapters:
    - time: "00:00"
      title: Introduction
    - time: "03:20"
      title: Chapters and transcripts
    - time: "12:45"
      title: Questions from listeners
  transcript_label: Read the transcript
  transcript: |
    **Host:** Welcome back. This week we look at how blocks keep a page consistent.

    **Guest:** And how a transcript opens the episode to search engines and to people who read instead of listen.
audio_rtl:
  src: audio/podcast-episode-12.mp3
  title: ساخت با بلوک‌ها، قسمت دوازدهم
  chapters:
    - time: "۰۰:۰۰"
      title: مقدمه
    - time: "۰۳:۲۰"
      title: فصل‌ها و متن گفتار
    - time: "۱۲:۴۵"
      title: پرسش‌های شنوندگان
  transcript_label: خواندن متن گفتار
  transcript: |
    **گوینده:** به این قسمت خوش آمدید. این هفته به این می‌پردازیم که بلوک‌ها چگونه یک صفحه را یکدست نگه می‌دارند.

    **مهمان:** و اینکه متن گفتار چگونه قسمت را برای موتورهای جستجو و کسانی که به‌جای شنیدن می‌خوانند باز می‌کند.
---

The sample points at `audio/podcast-episode-12.mp3`. This repository ships no audio file, so add your own episode at that path; until then the player shows its native error. The player needs no JavaScript, and the transcript works with the native disclosure.

## Left-to-right

{::nomarkdown}
{% include component-css.html name="audio" %}
{% include blocks/audio.html src=page.audio.src title=page.audio.title chapters=page.audio.chapters transcript=page.audio.transcript transcript_label=page.audio.transcript_label %}
{:/nomarkdown}

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/audio.html src=page.audio_rtl.src title=page.audio_rtl.title chapters=page.audio_rtl.chapters transcript=page.audio_rtl.transcript transcript_label=page.audio_rtl.transcript_label %}
</div>
{:/nomarkdown}
