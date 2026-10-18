# 0005. Brand: the "slip" mark and the quiet bronze palette

**Status:** Accepted (2026-10-18)

## Context

Slipway belongs to a family of products that share one visual language: a mark built from concentric rings on a 256 px canvas, a dark-first palette, and a calm, flat style. Seaworthy (rings and a waterline) and Evergreen (three rings with staggered notches) already follow it. Each product has its own color family so that they are told apart at a glance: Evergreen green, Seaworthy desert rose, a third product blue, and Slipway something new. The brand epic (#32) asks for Slipway's mark (#53), then the kit built from it (#54), then social assets (#55).

The maintainer's brief for the mark and palette: in the family of the two earlier marks, a different color family from green, rose, and blue, calm and easy on the eyes (nothing loud), and not a common color for software brands.

## Options

**Palette.** Sixteen colors were laid out from "everywhere in software" to "rarely seen", with the families already taken marked. Bright amber, violet, and graphite-with-orange were rejected as too loud or too close to the blue product. Four calm palettes were compared on a dark page sample: quiet bronze, lilac stone, warm taupe, and dusty ochre. Quiet bronze was chosen. Lilac stone was kept aside for another project.

**Mark.** Three rounds of sketches. The first, a ring on a ramp, a set of ways, and a hull on a ramp, was dropped because the maintainer wanted a new design in the ring family. The second round tried four ideas: stepped notches (three rings, each notch lower), an inner ring sliding out of an outer ring, two rings split by a diagonal ramp, and three arcs that open wider toward the sea. The maintainer chose the third, "split by the ramp".

## Decision

### The mark

Two concentric rings, cut by one diagonal slip: the part above the slip is light, the part below it is bronze, and a gap separates the halves. It reads as the ramp a ship slides down into the water, and as Seaworthy's ring-and-waterline turned through 35 degrees. The master file is `brand/assets/slipway-mark-dark.svg`.

| Property | Value |
| --- | --- |
| Canvas | 256 × 256, the same as Seaworthy and Evergreen |
| Rings | centered at (128, 128); radii 88 and 58; stroke 16 |
| Slip | a line through the center at 35 degrees below horizontal, sloping down to the right |
| Gap | 9 px on each side of the line, 18 px in total |
| Above the slip | the light tone (`#F4EFE4` on dark) |
| Below the slip | the bronze accent (`#B8975A` on dark) |
| Light surfaces | rings `#17130F` above the slip and `#8C7648` below it |

At 16 px the gap is about 1 px and the two rings and both colors are still distinguishable (checked in Chrome on a dark tile). The favicon task (`brand.kit`) may widen the gap or thicken the strokes for sizes below 24 px, as Seaworthy's did.

### The palette: quiet bronze

| Token | Hex | Use |
| --- | --- | --- |
| `canvas` | `#17130F` | page background, dark-first |
| `surface` | `#26201A` | cards and raised areas |
| `bronze-soft` | `#8C7648` | accent on light backgrounds (graphics only), borders |
| `bronze` | `#B8975A` | main accent on dark backgrounds |
| `tint` | `#D9C9A3` | soft highlight, secondary rings |
| `light` | `#F4EFE4` | light background and the light half of the mark |
| `text` | `#E6DFD0` | body text on dark |
| `ink-bronze` | `#5E4A26` | text and thin lines on light backgrounds |

Contrast, computed from the hex values:

| Pair | Ratio | Rule it meets |
| --- | ---: | --- |
| `text` on `canvas` | 13.9 : 1 | far above 4.5 : 1, and softer than pure white on black |
| `text` on `surface` | 12.1 : 1 | text |
| `bronze` on `canvas` | 6.7 : 1 | text of any size |
| `bronze` on `surface` | 5.8 : 1 | text |
| `light` on `canvas` | 16.1 : 1 | the mark's light half |
| `ink-bronze` on `light` | 7.4 : 1 | text on light backgrounds |
| `bronze-soft` on `light` | 3.8 : 1 | graphics and borders only (3 : 1), never text |

Semantic colors for status stay the family's shared rule: they are not drawn from the brand palette.

### Family rules this follows

- A 256 px canvas, flat fills, no gradients or effects.
- Concentric rings as the core shape; one idea per mark.
- Dark-first, with a light variant.
- The mark must hold at 32 px in full color; the favicon variant covers 16 to 48 px.

## Consequences

- `brand.kit` (#54) builds from this file: the four colorways (dark, light, mono, mono-light), the favicon set, the badge, the guide, and the use policy. The guide repeats these tokens and the contrast table, and a test checks that the guide and the tokens agree, as Seaworthy's does.
- The badge ("Built with Slipway") must use `bronze` on `canvas` and carry a word, not only a color.
- Only the geometry and colors are decided here. Not yet verified: one-color and print reproduction, how the mark looks next to the other three marks in one row, and whether 18 px of gap survives a small PNG export; each is a check in #54.
- Lilac stone stays reserved for a later project, so no other Slipway material may use it.
