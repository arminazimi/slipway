---
title: The garden
description: Every note, sorted by how grown it is and by when it last changed.
layout: page
---

A garden is a set of notes that change over time. Each note says how grown it is: a **seedling** is an idea I am still working out, a **budding** note has a shape but not its final one, and an **evergreen** note is one I would stand behind.

{% assign stages = "seedling|Seedlings,budding|Budding,evergreen|Evergreen" | split: "," %}

{% for pair in stages %}
{% assign parts = pair | split: "|" %}
## {{ parts[1] }}

{% assign notes = site.pages | where: "stage", parts[0] | sort: "title" %}
<ul>
{% for note in notes %}
  <li><a href="{{ note.url | relative_url }}">{{ note.title }}</a>{% if note.description %} — {{ note.description }}{% endif %}</li>
{% endfor %}
</ul>

{% endfor %}

## Recently tended

{% assign tended = site.pages | where_exp: "p", "p.tended" | sort: "tended" | reverse %}
<ul>
{% for note in tended limit: 5 %}
  <li><a href="{{ note.url | relative_url }}">{{ note.title }}</a> — tended {{ note.tended | date: "%B %-d, %Y" }}</li>
{% endfor %}
</ul>
