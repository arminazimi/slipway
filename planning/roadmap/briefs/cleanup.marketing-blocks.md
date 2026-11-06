## Goal
Delete blocks that do not belong in docs: pricing, testimonial, logos, people, gallery, audio, hero, stats, compare, pull-quote, timeline, chart, citation, download, annotations.

## Files

**Edit**
- `_includes/blocks/pricing.html`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Delete each block's include, CSS in `assets/css/components/`, test in `tools/theme/`, and page in `site/blocks/`.
2. Remove them from any schema in `schema/blocks/`.

## Done when
- [ ] `npm run check` passes.
