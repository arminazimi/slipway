# \`doctor.schema-coverage\`

Agents create content safely only where a schema describes it. When an agent creates a page with an unknown layout, it might use front matter keys that the layout does not expect, or omit keys that the layout requires.

This check ensures that every layout used by pages in your site is covered by a schema in \`schema/front-matter/\` (or your site's own \`content-schemas.json\`).

## Why it matters
Agents use your schemas to understand what fields a layout accepts, what types they should be, and which are required. Without a schema, agents can make mistakes when generating front matter, leading to broken pages or missing content.

## How to fix
If this check finds a layout without a schema, you should create a JSON Schema file for that layout in \`schema/front-matter/\` and add an entry to \`content-schemas.json\` to map the schema to the pages using that layout.

## Examples

### Bad
A page uses a custom layout \`recipe\` but there is no schema for it.
\`\`\`yaml
---
layout: recipe
title: Pancakes
---
\`\`\`

### Good
The \`recipe\` layout has a schema \`schema/front-matter/recipe.schema.json\` and it is listed in \`content-schemas.json\`.
\`\`\`json
{
  "schemas": [
    {
      "files": ["recipes/**/*.md"],
      "target": "front-matter",
      "schema": "schema/front-matter/recipe.schema.json",
      "when": {
        "layout": "recipe"
      }
    }
  ]
}
\`\`\`
