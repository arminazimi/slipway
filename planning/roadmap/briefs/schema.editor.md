## Goal
Editor autocomplete for config and front matter (YAML language server hints).

## Agent brief

**Context**
Editors with the YAML language server (VS Code, Zed, Neovim) autocomplete and validate YAML when a schema is attached. Front matter is YAML inside Markdown, which needs a different hook than `_config.yml`.

**Steps**
1. Add `# yaml-language-server: $schema=...` to the top of each example `_config.yml`, pointing at the schema's stable URL from `spec.site` (or a relative path until it exists).
2. Add `.vscode/settings.json` to `starter-files/` mapping `_config.yml` and `_data/navigation.yml` to their schemas.
3. Document front-matter completion in `docs/editor.md` (VS Code: the Front Matter CMS or a `yaml.schemas` glob; note what does not work).
4. Test that every schema path referenced in those files exists.

**Files**
- `examples/*/_config.yml` (one comment line)
- `starter-files/.vscode/settings.json`
- `docs/editor.md`

**Do not**
- Do not expand scope beyond this issue; open a follow-up instead.
- Do not change a versioned contract (report schema, check IDs, config schema) without updating its spec and changelog.
- Do not add network access to checks unless the check is marked opt-in.
- Do not require an editor extension for anything the build needs.

**Run**
```bash
npm ci
npm run check
```

## Done when
- [ ] Opening an example `_config.yml` in VS Code with the YAML extension shows completions for `slipway.*` keys.
- [ ] The path test passes.
- [ ] `docs/editor.md` covers VS Code and one other editor.
