---
title: KBD block
description: Keyboard shortcut block with platform variants.
layout: page
---

{::nomarkdown}{% include component-css.html name="kbd" %}{:/nomarkdown}

## Left-to-right

### Command Palette

{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}

```liquid
{% raw %}{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}{% endraw %}
```

### Save

{% include blocks/kbd.html mac="⌘S" other="Ctrl+S" %}

```liquid
{% raw %}{% include blocks/kbd.html mac="⌘S" other="Ctrl+S" %}{% endraw %}
```

### Find

{% include blocks/kbd.html mac="⌘F" other="Ctrl+F" %}

```liquid
{% raw %}{% include blocks/kbd.html mac="⌘F" other="Ctrl+F" %}{% endraw %}
```

### Inspect Element

{% include blocks/kbd.html mac="⌥⌘I" other="Ctrl+Shift+I" %}

```liquid
{% raw %}{% include blocks/kbd.html mac="⌥⌘I" other="Ctrl+Shift+I" %}{% endraw %}
```

## Right-to-left

The keys are code, so they keep their order in a right-to-left page.

<div dir="rtl">
{% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}
</div>

```html
{% raw %}<div dir="rtl">
  {% include blocks/kbd.html mac="⌘K" other="Ctrl+K" %}
</div>{% endraw %}
```
