## Goal
Decide the site config file the engine reads, its keys, and the mapping from Jekyll `_config.yml` so Evergreen can move without rewriting content.

## Files

**Create**
- `docs/adr/0024-site-config.md`

Touch no other file. If one must change, stop and say why in the issue.

## Steps
1. One file, `slipway.yml`, at the site root; optional `slipway.config.ts` for code (plugins) later.
2. Minimum keys: title, description, url, base path, lang, source folder, navigation file, repository (for edit links), theme options, search, redirects, outputs on/off.
3. Front matter keys the engine reads: title, description, layout, permalink, redirect_from, lang, dir, order, status, agent.
4. A table mapping each `_config.yml` key Slipway 0.2 used to its new key or to "dropped".
5. Compatibility: `_data/navigation.yml` keeps its shape; pages without front matter still build.

## Done when
- [ ] The ADR is merged with status Accepted.
- [ ] Every key Slipway 0.2 documented in `site/config.md` appears in the mapping table.
- [ ] `npm run check` passes.
