---
title: File tree block
description: A folder structure with notes per file.
layout: page
---

{::nomarkdown}{% include component-css.html name="file-tree" %}{:/nomarkdown}

## Left-to-right

{% capture my_markdown_list %}
- `docs/` *Documentation files*
  - `README.md`
  - `setup/`
    - `install.md`
    - `config.md` *Important configuration steps*
- `src/`
  - `index.js`
  - `styles.css`
{% endcapture %}

{% include blocks/file-tree.html list=my_markdown_list %}

```liquid
{% raw %}{% capture my_markdown_list %}
- `docs/` *Documentation files*
  - `README.md`
  - `setup/`
    - `install.md`
    - `config.md` *Important configuration steps*
- `src/`
  - `index.js`
  - `styles.css`
{% endcapture %}

{% include blocks/file-tree.html list=my_markdown_list %}{% endraw %}
```

## Right-to-left

{% capture my_markdown_list_rtl %}
- `docs/` *پرونده‌های مستندات*
  - `README.md`
  - `setup/`
    - `install.md`
    - `config.md` *مراحل مهم پیکربندی*
- `src/`
  - `index.js`
  - `styles.css`
{% endcapture %}

<div dir="rtl">
{% include blocks/file-tree.html list=my_markdown_list_rtl %}
</div>

```html
{% raw %}{% capture my_markdown_list_rtl %}
- `docs/` *پرونده‌های مستندات*
  - `README.md`
  - `setup/`
    - `install.md`
    - `config.md` *مراحل مهم پیکربندی*
- `src/`
  - `index.js`
  - `styles.css`
{% endcapture %}

<div dir="rtl">
  {% include blocks/file-tree.html list=my_markdown_list_rtl %}
</div>{% endraw %}
```
