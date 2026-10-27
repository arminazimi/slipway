---
title: Recipes
description: Useful recipes for Slipway sites
layout: doc
permalink: /recipes/
date: 2024-03-20
author: Slipway
---

## Available recipes

We have recipes for various common tasks. Pick one below:

{% assign recipes = site.pages | where_exp: "item", "item.url contains '/recipes/' and item.url != '/recipes/'" | sort: "title" | sort: "nav_order" %}
<ul>
{% for r in recipes %}
  <li>
    <a href="{{ r.url }}">{{ r.title }}</a>
    {% if r.description %}
      <p>{{ r.description }}</p>
    {% endif %}
  </li>
{% endfor %}
</ul>
