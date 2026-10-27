---
title: File tree block
description: A folder structure with notes per file.
layout: page
---

## From items array (not supported directly in yaml front matter for includes, use capture)

{% capture my_tree %}
- name: "docs/"
  note: "Documentation files"
  children:
    - name: "README.md"
    - name: "setup/"
      children:
        - name: "install.md"
        - name: "config.md"
          note: "Important configuration steps"
- name: "src/"
  children:
    - name: "index.js"
    - name: "styles.css"
{% endcapture %}

{% comment %} No built-in fromyaml filter without plugin, using list instead for simplicity of demo {% endcomment %}

## From markdown list

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
