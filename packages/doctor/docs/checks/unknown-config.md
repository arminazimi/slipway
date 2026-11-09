# unknown-config

## Why it matters
The engine reads every key of `slipway.yml` (`mizzen.yml` on a renamed site), and the schema closes the set: an unknown key is ignored without an error, so a typo such as `headr:` or `repository.brnch:` silently does nothing. This check reports each unknown key at its line and suggests the closest valid one from the engine's config schema. On a 0.2 Jekyll site it checks the `slipway:` block of `_config.yml` against the theme's schema instead.

## How to fix
Rename the unknown key to the suggested valid key, or remove it if the engine does not support it.

### Bad
```yaml
title: Beacon
headr: minimal
repository:
  url: https://github.com/example/beacon-docs
  brnch: main
```

### Good
```yaml
title: Beacon
repository:
  url: https://github.com/example/beacon-docs
  branch: main
```
