# unknown-front-matter

Typing mistakes in front matter keys (like `tittle:` instead of `title:`) break pages silently. This check reports fields that the layout's schema does not know and suggests the closest valid key.

## Why it matters

Agents might accidentally produce typo'd keys, or content writers might misspell them. Reporting these mistakes early ensures proper parsing and page generation.

## How to fix

Rename the unknown key to the correct one suggested by the warning.

### Bad

```yaml
---
layout: page
tittle: My page
---
```

### Good

```yaml
---
layout: page
title: My page
---
```
