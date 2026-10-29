# 0015. Per-page social images: an `image` key everywhere, a generated default in Actions mode

**Status:** Accepted (2026-10-29).

## Context

Every page shares one social image, `assets/images/social.png` ([ADR 0012](0012-public-api.md), override slot 4), so a link to any page of a site shows the site's picture. When a page is shared on its own — a post, a release note, a guide — the preview should show that page, starting with its title. GitHub already renders per-page social cards this way for repository pages.

Two constraints shape how a default gets generated. Classic Pages runs no plugins, so nothing can be computed at build for it; and an Actions build must not need image libraries or fonts, so the generator stays pure Ruby standard library. Social scrapers take raster images (PNG, JPEG), not SVG, so the picture has to be drawn pixel by pixel.

## Decision

1. **`image` is a shared front-matter key** (schema/front-matter): a path on the site or an `https` URL, the page's own social image. It wins over everything else, in either mode.
2. **The shared asset stays the last fallback.** Without `image`, a page points at `assets/images/social.png`, which the site may replace (docs/overrides.md). Classic Pages has exactly this.
3. **Actions mode generates a default from the title.** A site that copies `_plugins/slipway_og.rb` into `_plugins/` (the way it adopts the twins plugin, [ADR 0006](0006-markdown-twins.md)) gets `assets/images/og/<page>.png` for every written page with a renderable title, and the page points at its picture through `page.slipway_og`. The plugin is opt-in per site: don't copy it, don't get it.
4. **The picture is pure Ruby.** The plugin writes a 1200×630 PNG with `zlib` alone — the theme's dark palette, the title wrapped to three lines in an embedded 5×7 bitmap font (the public-domain GLCD font), the site title above it. No ImageMagick, no fonts, no network. The pictures are rewritten every build, so they cannot go stale.
5. **A title the font cannot render keeps the shared image.** The bitmap font covers printable ASCII; a Persian or Chinese title would render as holes, so the plugin skips it and the page falls back to the shared asset. Per-page pictures for non-Latin titles wait for a rasterizer, which would end the pure-Ruby rule.
6. **`twitter:card` follows the picture.** A page with its own picture — `image` or generated — gets `summary_large_image`; a page on the shared default gets `summary`, so a site that never touches images shares exactly as before this ADR. `og:image:width/height` are emitted only where the size is known (the shared and generated pictures, both 1200×630).

## Consequences

- The precedence a page resolves its `og:image` by is: front matter `image`, then the generated picture (Actions mode only), then the shared asset. `_includes/seo.html` implements it in plain Liquid, so classic Pages reads the same rule.
- A site already replacing `social.png` sees no change. A site adding the plugin sees its pages gain per-page pictures without any content edit.
- The generated pictures sit under `assets/images/og/` in the output only; a site never commits them, and renaming a page renames its picture at the next build.
- The bitmap look is a floor, not a ceiling: a site wanting designed cards sets `image` per page, or shadows nothing and keeps the shared asset by leaving the plugin out.
