---
published: false
---
# Component CSS

This folder contains stylesheets for individual components.

New components put their CSS in `assets/css/components/<name>.css`.
These are linked exactly once per page using `{% include component-css.html name="<name>" %}`.
