# unknown-config

## Why it matters
Slipway themes read specific configuration keys under the `slipway:` section in `_config.yml` (and `_config.yaml`). If an agent or human adds a key with a typo (for example, `headr:` instead of `header:`), the site will silently ignore it and fail to apply the desired configuration. This check detects unknown configuration keys under the `slipway:` object, warns about them, and suggests the closest valid key based on the JSON schema, saving debugging time.

## How to fix
Rename the unknown key to the suggested valid key, or remove it if it is truly unsupported by Slipway.

### Bad
```yaml
slipway:
  headr: minimal
  tokens:
    acent: "#ff0000"
```

### Good
```yaml
slipway:
  header: minimal
  tokens:
    accent: "#ff0000"
```
