# One mode

Slipway has one mode. The engine (`packages/engine`, `@velella/mizzen`) reads the site's source files and writes the built site. It runs on Node 24 with no Jekyll and no GitHub Pages build, so there is no classic mode and no Actions mode to choose between.

What the engine reads and writes is set by the content model ([ADR 0003](adr/0003-content-model.md)), the config ([ADR 0024](adr/0024-site-config.md)), and the engine architecture ([ADR 0022](adr/0022-engine.md)). The engine replaced Jekyll under [ADR 0021](adr/0021-docs-first.md).

The Jekyll-era feature table, which listed what classic GitHub Pages and the Jekyll plugins each supported, no longer applies and is removed. Each feature gets its place in this page when its engine task lands.
