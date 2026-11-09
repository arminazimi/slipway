# Tokens

Design tokens, one group per file: `tokens/<group>.json`, lowercase kebab-case ([ADR 0023](../../../docs/adr/0023-engine-theme-boundary.md)). A group file is a JSON object of token names to values; the registry reads the groups in sorted path order.

A `tokens/<group>.light.json` file sets only the light values of a group. Its dark values and motion reduced values come from `names.json` or a plain `<group>.json` file. Example, `tokens/color.light.json` sets `canvas` and `text`; `color.dark.json` is not supported yet.

Example, `tokens/space.json`:

```json
{
  "1": "0.25rem",
  "2": "0.5rem",
  "3": "1rem"
}
```
