---
title: People block
description: A responsive grid of people with avatars, roles, and links, from a list or from `_data/authors.yml`.
layout: page
people:
  - name: Ada Rahimi
    role: Typographer
    avatar: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop
    url: /blocks/people.html
    links:
      - label: Website
        url: https://example.org/ada
      - label: Blocks
        url: /blocks/
  - name: Sam Okafor
    role: Editor
    avatar: https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop
    avatar_alt: Portrait of Sam Okafor
    links:
      - label: Website
        url: https://example.org/sam
  - name: Mina Ahmadi
    role: Translator
people_rtl:
  - name: آدا رحیمی
    role: حروف‌چین
    avatar: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop
    url: /blocks/people.html
    links:
      - label: وب‌سایت
        url: https://example.org/ada
  - name: سام اوکافور
    role: ویراستار
  - name: مینا احمدی
    role: مترجم
---

{::nomarkdown}{% include component-css.html name="people" %}{:/nomarkdown}

## Left-to-right

{::nomarkdown}
{% include blocks/people.html people=page.people id="team" %}
{:/nomarkdown}

## Right-to-left

{::nomarkdown}
<div dir="rtl">
{% include blocks/people.html people=page.people_rtl %}
</div>
{:/nomarkdown}

## Data

Every entry needs a `name`. It may also have a `role`, an `avatar`, an `avatar_alt` (the name is the default), the `url` that the name links to, and `links` of `{ label, url }`. A link that starts with `/` gets the site's `baseurl`.

`people=site.data.authors` works with a `_data/authors.yml` shaped like the ones in `examples/`: a map renders one card per key, its `bio` takes the place of `role`, and its links use `{ title, url }`. A YAML list of the same objects works as well.

Use `id` to give the list an id: `{% raw %}{% include blocks/people.html people=page.people id="team" %}{% endraw %}`.
