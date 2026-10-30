---
title: Citation block
description: A numbered reference list with in-text cites that link to it.
layout: page
references:
  - id: 1
    text: Knuth, Donald E. The TeXbook. Addison-Wesley, 1984.
    url: https://example.com/texbook
  - id: 2
    text: Berners-Lee, Tim. Universal Resource Identifiers. RFC 1630, 1996.
    url: https://example.com/rfc1630
references_rtl:
  - id: 3
    text: حافظ شیرازی. دیوان حافظ. انتشارات امیرکبیر، ۱۳۷۵.
    url: https://example.com/hafez
  - id: 4
    text: فردوسی. شاهنامه. انتشارات هرمس، ۱۳۸۹.
    url: https://example.com/shahnameh
---

{::nomarkdown}{% include component-css.html name="citation" %}{:/nomarkdown}

## Left-to-right

The TeXbook describes the standard for TeX{% include blocks/citation.html ref=1 %}, and RFC 1630 defines the URI syntax{% include blocks/citation.html ref=2 %}.

{% include blocks/citation.html references=page.references %}

## Right-to-left

<div dir="rtl">

دیوان حافظ یکی از آثار کلاسیک ادب فارسی است{% include blocks/citation.html ref=3 %}.

{% include blocks/citation.html references=page.references_rtl id="references-rtl" %}

</div>

## Include parameters

A reference list takes `references` and an optional `id` for the list element:

```liquid
{% raw %}{% include blocks/citation.html references=page.references id="sources" %}{% endraw %}
```

Each entry has a `text`, an optional `id` (the loop position is the default), and an optional `url`. The list item for an entry with `id: 1` is `#ref-1`.

An in-text cite takes `ref` and an optional `text` for the label:

```liquid
{% raw %}{% include blocks/citation.html ref=1 text="1" %}{% endraw %}
```

`ref` must match an entry's `id` in a list on the same page.
