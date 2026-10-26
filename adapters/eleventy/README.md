# slipway-eleventy

Eleventy plugin for the [agent-editable site spec](../../spec/agent-editable). It adds:

- `sourcemap.json` in the output folder, with the source file and line of every heading and link.
- Markdown twins of every page, so agents can read the content without the layout.
- `data-source="<file>:<line>"` on every heading, so agents can offer edit buttons.
- `starter/`: `AGENTS.md` and content schemas, to copy into new sites.

## Use

```js
import slipway from "slipway-eleventy";

export default function(eleventyConfig) {
  eleventyConfig.addPlugin(slipway);
};
```
