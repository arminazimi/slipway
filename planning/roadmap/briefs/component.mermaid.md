## Goal
Turn ```` ```mermaid ```` fences into inline SVG at build time, with the diagram source kept for agents.

## Files

**Create**
- `packages/theme/components/mermaid/index.tsx`
- `packages/theme/components/mermaid/style.css`
- `packages/theme/test/component-mermaid.test.tsx`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. Render with a headless renderer during the build; no Mermaid in the browser.
2. Colors from tokens; a text alternative from `alt=`.

## Done when
- [ ] Renders the fixture examples; light, dark, and right-to-left screenshots in the pull request.
- [ ] Styles use only token names from `packages/theme/tokens/names.json`.
- [ ] `npm run check` passes.
