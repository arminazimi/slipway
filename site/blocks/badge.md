---
title: Badge block
description: Small inline labels such as stable, beta, deprecated, and new.
layout: page
---

{::nomarkdown}{% include component-css.html name="badge" %}{:/nomarkdown}

## Left-to-right

### Stable

{% include blocks/badge.html label="Stable" status="stable" %}

```liquid
{% raw %}{% include blocks/badge.html label="Stable" status="stable" %}{% endraw %}
```

### Beta

{% include blocks/badge.html label="Beta" status="beta" %}

```liquid
{% raw %}{% include blocks/badge.html label="Beta" status="beta" %}{% endraw %}
```

### Deprecated

{% include blocks/badge.html label="Deprecated" status="deprecated" %}

```liquid
{% raw %}{% include blocks/badge.html label="Deprecated" status="deprecated" %}{% endraw %}
```

### New

{% include blocks/badge.html label="New" status="new" %}

```liquid
{% raw %}{% include blocks/badge.html label="New" status="new" %}{% endraw %}
```

### Experimental

{% include blocks/badge.html label="Experimental" status="experimental" %}

```liquid
{% raw %}{% include blocks/badge.html label="Experimental" status="experimental" %}{% endraw %}
```

## Right-to-left

<div dir="rtl">
{% include blocks/badge.html label="پایدار" status="stable" %}
{% include blocks/badge.html label="بتا" status="beta" %}
{% include blocks/badge.html label="منسوخ" status="deprecated" %}
{% include blocks/badge.html label="جدید" status="new" %}
{% include blocks/badge.html label="آزمایشی" status="experimental" %}
</div>

```html
{% raw %}<div dir="rtl">
  {% include blocks/badge.html label="پایدار" status="stable" %}
  {% include blocks/badge.html label="بتا" status="beta" %}
  {% include blocks/badge.html label="منسوخ" status="deprecated" %}
  {% include blocks/badge.html label="جدید" status="new" %}
  {% include blocks/badge.html label="آزمایشی" status="experimental" %}
</div>{% endraw %}
```
