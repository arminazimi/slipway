---
title: Cards block
description: A responsive grid of cards for links and features, from a list in the front matter or `_data`.
layout: page
cards:
  - title: Install and quickstart
    url: /install/
    label: Guide
    description: Add Slipway to a new or an existing Jekyll site.
  - title: Block reference
    url: /blocks/
    description: Live examples and copyable snippets for every block.
  - title: Configuration
    url: /config/
    label: Reference
    description: Every configuration key, its default, and an example.
cards_plain:
  - title: No destination
    label: Note
    description: This card has no url, so it renders no anchor.
  - title: Configuration
    url: /config/
    description: Cards with and without a link can share a grid.
  - title: Block reference
    url: /blocks/
    description: Live examples and copyable snippets for every block.
cards_rtl:
  - title: نصب و شروع سریع
    url: /install/
    label: راهنما
    description: اسلیپ‌وی را به یک سایت تازه یا موجود اضافه کنید.
  - title: مرجع بلوک‌ها
    url: /blocks/
    description: نمونه‌های زنده و قطعه‌کدهای قابل کپی برای همه بلوک‌ها.
  - title: پیکربندی
    url: /config/
    label: مرجع
    description: همه کلیدهای پیکربندی، مقدار پیش‌فرض و یک نمونه.
---

{::nomarkdown}{% include component-css.html name="cards" %}{:/nomarkdown}

## Left-to-right

{::nomarkdown}
{% include blocks/cards.html items=page.cards %}
{:/nomarkdown}

```liquid
{% raw %}{% include blocks/cards.html items=page.cards %}{% endraw %}
```

### Two columns

`columns` caps the grid at one to four columns. The default is three.

{::nomarkdown}
{% include blocks/cards.html items=page.cards columns=2 %}
{:/nomarkdown}

```liquid
{% raw %}{% include blocks/cards.html items=page.cards columns=2 %}{% endraw %}
```

### Without a link

A card with no `url` is a plain description card and renders no anchor.

{::nomarkdown}
{% include blocks/cards.html items=page.cards_plain %}
{:/nomarkdown}

```liquid
{% raw %}{% include blocks/cards.html items=page.cards_plain %}{% endraw %}
```

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/cards.html items=page.cards_rtl %}
</div>
{:/nomarkdown}

```html
{% raw %}<div dir="rtl">
  {% include blocks/cards.html items=page.cards_rtl %}
</div>{% endraw %}
```

## Data

Every entry needs a `title`. It may also have the `url` the whole card links to, a short `label`, and a `description`. The grid and the text follow the page direction, and the layout needs no JavaScript.

```yaml
cards:
  - title: Install and quickstart
    url: /install/
    label: Guide
    description: Add Slipway to a new or an existing Jekyll site.
```

`cards=site.data.cards` works with a `_data/cards.yml` that holds the same list.
