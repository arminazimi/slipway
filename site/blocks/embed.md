---
title: Embed block
description: A privacy-first video card for YouTube, Vimeo, and Aparat that requests nothing until the reader clicks.
layout: page
youtube:
  id: aqz-KE-bpKQ
  title: Big Buck Bunny
  poster: /assets/images/social.png
vimeo:
  id: "76979871"
  title: The New Vimeo Player
aparat:
  id: 6b9n4z
  title: Aparat sample clip
youtube_rtl:
  title: خرگوش بزرگ
vimeo_rtl:
  title: پخش‌کنندهٔ ویمیو
aparat_rtl:
  title: نماهنگ نمونهٔ آپارات
---

The card is a plain link to the provider's watch page. Until the reader activates it, the page requests nothing from YouTube, Vimeo, or Aparat: there is no iframe, no player script, and no cookie. The provider first sees a request after the click, when its site opens in a new tab. Because nothing is embedded, the strict Content Security Policy from the repository's security guide needs no `frame-src` exception for this block.

The IDs below are samples; replace them with your own videos. The `poster` parameter is optional: leave it out for a text-only card, or point it at an image, and it appears above the title with lazy loading. An unknown `provider` falls back to YouTube, and an empty `id` renders nothing.

## Left-to-right

### YouTube

{::nomarkdown}
{% include blocks/embed.html provider="youtube" id=page.youtube.id title=page.youtube.title poster=page.youtube.poster %}
{:/nomarkdown}

```liquid
{% raw %}{% include blocks/embed.html provider="youtube" id="aqz-KE-bpKQ" title="Big Buck Bunny" poster="/assets/images/social.png" %}{% endraw %}
```

### Vimeo

{::nomarkdown}
{% include blocks/embed.html provider="vimeo" id=page.vimeo.id title=page.vimeo.title %}
{:/nomarkdown}

```liquid
{% raw %}{% include blocks/embed.html provider="vimeo" id="76979871" title="The New Vimeo Player" %}{% endraw %}
```

### Aparat

{::nomarkdown}
{% include blocks/embed.html provider="aparat" id=page.aparat.id title=page.aparat.title %}
{:/nomarkdown}

```liquid
{% raw %}{% include blocks/embed.html provider="aparat" id="6b9n4z" title="Aparat sample clip" %}{% endraw %}
```

## Right-to-left

<div dir="rtl">
{% include blocks/embed.html provider="youtube" id=page.youtube.id title=page.youtube_rtl.title %}
{% include blocks/embed.html provider="vimeo" id=page.vimeo.id title=page.vimeo_rtl.title %}
{% include blocks/embed.html provider="aparat" id=page.aparat.id title=page.aparat_rtl.title %}
</div>

```html
{% raw %}<div dir="rtl">
  {% include blocks/embed.html provider="youtube" id="aqz-KE-bpKQ" title="خرگوش بزرگ" %}
  {% include blocks/embed.html provider="vimeo" id="76979871" title="پخش‌کنندهٔ ویمیو" %}
  {% include blocks/embed.html provider="aparat" id="6b9n4z" title="نماهنگ نمونهٔ آپارات" %}
</div>{% endraw %}
```
