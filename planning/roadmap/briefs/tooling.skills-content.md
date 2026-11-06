## Goal
`slipway-content` and `slipway-site` teach agents the engine: `slipway.yml`, front matter keys, directives, and `slipway check`.

## Files

**Edit**
- `skills/slipway-content/SKILL.md`
- `skills/slipway-content/reference/front-matter.md`
- `skills/slipway-content/examples/doc-page.md`
- `skills/slipway-site/SKILL.md`
- `skills/slipway-site/reference/config.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Regenerate references with `npm run build:skills` if the generator still applies; otherwise write them by hand from the schema.

## Done when
- [ ] No mention of `_config.yml`, Liquid, or `remote_theme` remains in these Skills.
- [ ] `npm run check` passes.
