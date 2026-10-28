---
title: Pagefind search
description: Swap the built-in search for Pagefind on sites with thousands of pages.
layout: doc
---

The built-in search uses a single JSON index per language. For sites with thousands of pages, [Pagefind](https://pagefind.app/) offers a faster, low-bandwidth search. It requires **Actions mode** because it needs a post-build step.

## 1. Remove the built-in search

Delete `search.json` (or any file with `layout: search-index`) from your site. When the theme cannot find the search index, it removes the built-in search form from the header automatically.

## 2. Add the search page

Create a new page for your search (e.g., `search.md`). Add the Pagefind UI container, keeping it hidden by default to provide a no-JavaScript fallback.

```html
<link href="/pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-ui.js" defer></script>

<div id="search" hidden></div>
<noscript>
  <p>Please enable JavaScript to use the search function.</p>
</noscript>

<script defer>
  window.addEventListener('DOMContentLoaded', (event) => {
      document.getElementById('search').removeAttribute('hidden');
      new PagefindUI({ element: "#search", showSubResults: true });
  });
</script>
```

## 3. Link to it

Add the new search page to your `_data/navigation.yml`:

```yaml
main:
  - title: Search
    url: /search/
```

## 4. Run Pagefind in your workflow

After your Jekyll build step in your GitHub Actions workflow, run the Pagefind CLI on the output directory:

```yaml
- run: npx pagefind --site _site
```
