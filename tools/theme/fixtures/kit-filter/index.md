---
layout: base
title: Filter
---

A filter field before a table; without JavaScript every row shows.

{% include filter.html %}

| Rule | Summary |
| --- | --- |
| Crème brûlée | A dessert with a burnt sugar top |
| Résumé | A short summary of a career |
| Plain | A row without accents |

A second field that names the list it filters.

{% include filter.html target="#languages" %}

<ul id="languages">
  <li>Français</li>
  <li>Español</li>
  <li>English</li>
</ul>
