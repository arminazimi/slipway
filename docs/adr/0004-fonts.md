# 0004. Fonts: self-hosted OFL fonts, an editorial serif for Latin, Vazirmatn for Persian

**Status:** Accepted (2026-10-18)

## Context

Slipway's look rests on type: a display serif, numbered sections, and hairline rules, in Latin and in Persian (right to left). The fonts must be free to bundle, small enough for a page that promises to read without JavaScript, and good at Persian: joiners, digits, punctuation, and mixed Latin and Persian lines. Issue #2 asks which fonts to use, under what license, at what size, and how they render.

## Method

Fourteen font packages from Fontsource (all published under the SIL Open Font License 1.1) were installed in a scratch folder. For each, the woff2 file sizes were read from the files. Seven pairings were rendered side by side in Chrome 155 on macOS with a specimen that has headings, body text, Latin and Persian digits, thousands and decimal separators, a space-free joiner (ZWNJ) in words such as «می‌شود», and an ezafe with hamza («نسخهٔ»). The specimen is saved at [assets/0004-font-pairings.png](assets/0004-font-pairings.png). Only Chrome on one machine was tested.

## Results

### License

Every candidate is OFL-1.1, which allows bundling, self-hosting, and use on any site, including commercial ones. The license text must travel with the font files. Fonts cannot be sold on their own. Fontsource packages include the license file.

### Size (woff2, one file)

| Role | Font | Files | Size |
| --- | --- | --- | ---: |
| Latin display serif | Instrument Serif | regular; italic | 21 KB; 22 KB |
| Latin body serif | Source Serif 4 (variable, all weights) | roman; italic | 50 KB; 50 KB |
| | IBM Plex Serif | 400; 600 | 19 KB; 20 KB |
| | Newsreader (variable) | roman | 57 KB |
| | Literata (variable) | roman | 51 KB |
| Persian sans | Vazirmatn (variable, all weights) | Arabic-script subset; Latin subset | 45 KB; 34 KB |
| | Estedad | 400; 700 | 27 KB; 27 KB |
| | IBM Plex Sans Arabic | 400 | 42 KB |
| Persian serif style | Noto Naskh Arabic | 400; 700 | 51 KB; 52 KB |
| | Amiri | 400 | 106 KB |
| Persian display | Lalezar | one weight | 50 KB |

The Arabic-script subsets of Vazirmatn, Estedad, Noto Naskh, and Amiri cover Persian letters (U+0600 to U+06FF, which includes Persian digits U+06F0 to U+06F9) and the zero-width non-joiner (U+200C). Fonts are split by Unicode range, so a page with no Persian text does not download the Persian file.

### Rendering (Chrome 155, see the specimen)

- **Instrument Serif** is distinctive and right for large headings, but it has one weight and a narrow, light cut; at body size it is too thin to read comfortably (pairings A and G).
- **Source Serif 4** reads well at body size and its variable weights suit headings and text (B and F).
- **Vazirmatn** has an even, modern Persian text face, with weights from 100 to 900 in one file; joiners, Persian digits, and the separators `٬` and `٫` rendered correctly in every pairing (A and B). It sits well next to a Latin serif.
- **Estedad** is slightly heavier and rounder (C); **IBM Plex Sans Arabic** matches the Plex pair (E). Both are fine.
- **Noto Naskh** has a book-like Persian text face that fits an editorial serif, at smaller apparent size and about 100 KB for two weights (D). **Amiri** is calligraphic and heavy to load (F). **Lalezar** is a display face only (G).

## Decision

1. **Self-host every font** as woff2 under `assets/fonts/`, with the license files in `assets/fonts/LICENSES/`. The theme does not link to Google Fonts: it keeps a reader's visit between them and the site, avoids a third-party connection and its privacy questions, and does not depend on a service that some readers cannot reach.
2. **Default pairing:** Instrument Serif for large Latin headings; Source Serif 4 (variable) for Latin body text and small headings; Vazirmatn (variable) for all Persian text. A Persian page with Latin and Persian text loads at most Instrument Serif 21 KB, Source Serif 4 50 KB, and Vazirmatn 45 KB: about 116 KB, and less when a subset is not used.
3. **Presets, not defaults:** `classic` pairs Source Serif 4 with Noto Naskh Arabic for Persian; `plex` uses IBM Plex Serif with IBM Plex Sans Arabic. Both are `font` tokens in `_config.yml` (task `theme.config`), and each lists its sizes in the docs.
4. **No Amiri, Lalezar, or Instrument Serif at body size** in any preset.
5. **Fallbacks and loading:** `font-display: swap`, a fallback stack that names a system serif and `Tahoma`-class sans for Persian, and `preload` for only the first font a page needs. A follow-up task measures and sets `size-adjust` so the swap does not shift the layout.
6. **Digits are the theme's job.** The fonts draw Persian digits correctly when they are in the text; converting `0123` to `۰۱۲۳` for `lang: fa` is `theme.persian`.

## Consequences

- The default adds about 116 KB of fonts to a Persian page. The roadmap's budget is no JavaScript to read a page, but it has no font budget yet; the follow-up should set one (for example 130 KB for the default pairing) and test it in CI.
- A reader who switches font presets changes page weight by up to 50 KB. The docs say so.
- Only Chrome on macOS was tested, with a short specimen. Firefox, Safari, and Windows (where Persian shaping and hinting can differ) need the same specimen before the first release, plus a check of long documents with many digits.
- Variable fonts keep the file count low but ship all weights; if a site uses two weights only, static files can be smaller (Estedad: 54 KB for two weights against Vazirmatn's 45 KB for all of them, so no gain here).
