---
title: Guides
description: Deep-dive guides for working with Slipway
layout: doc
permalink: /guides/
date: 2024-03-20
author: Slipway
---

## Available guides

We have guides for various tasks. Pick one below:

{% assign all_guides = site.pages | where_exp: "item", "item.url contains '/guides/'" %}
{% assign filtered_guides = all_guides | where_exp: "item", "item.url != '/guides/'" | sort: "title" %}
<ul>
{% for g in filtered_guides %}
  <li>
    <a href="{{ g.url }}">{{ g.title }}</a>
    {% if g.description %}
      <p>{{ g.description }}</p>
    {% endif %}
  </li>
{% endfor %}
</ul>
