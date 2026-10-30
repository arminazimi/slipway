# Architecture decision records

| ADR | Decision |
| --- | --- |
| [0001](0001-why-slipway.md) | Slipway: a Jekyll-first, agent-native theme that depends on Seaworthy | Accepted (decision 4 changed by 0011 until 1.1) |
| [0002](0002-webmcp.md) | WebMCP ships as an opt-in, feature-detected script with read-only tools | Accepted |
| [0003](0003-content-model.md) | The content model is the Jekyll file layout, limited to a subset other frameworks can read in place | Accepted (key `dir` renamed by 0006) |
| [0004](0004-fonts.md) | Fonts: self-hosted OFL fonts, an editorial serif for Latin, Vazirmatn for Persian | Accepted |
| [0005](0005-brand-mark-and-palette.md) | Brand: the "slip" mark and the quiet bronze palette | Accepted |
| [0006](0006-markdown-twins.md) | Markdown twins: a stub per page on classic Pages, a generator in Actions mode | Accepted |
| [0007](0007-source-maps.md) | Source maps: three levels, from a Liquid page map to a plugin with exact lines | Accepted |
| [0008](0008-theme-palette.md) | Theme palette: desert rose on muted sand and charcoal | Accepted |
| [0011](0011-standalone-and-the-spec.md) | Slipway 1.0 is standalone: a theme and an agent-editable site spec; Seaworthy integration follows in 1.1 | Accepted |
| [0012](0012-public-api.md) | The public API under semver: what sites may rely on, and how it is deprecated | Accepted |
| [0013](0013-astro-adapter.md) | The Astro adapter follows the framework-neutral content model using content loaders and endpoints | Accepted |
| [0014](0014-evergreen.md) | Evergreen is optional: Slipway may use it and offer it to sites, and the dependency points one way | Accepted |
| [0015](0015-og-images.md) | Per-page social images: an `image` key everywhere, a generated default in Actions mode | Accepted |
| [0019](0019-api-model.md) | The API model: one JSON file of modules, symbols, signatures, docs, and source for every converter | Accepted |
