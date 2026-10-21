# Theme design tokens and editorial type system: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship epic #3: a token-driven theme (light, Charcoal dark, desert rose) restyled from `_config.yml`, with a contrast test.

**Architecture:** `tokens/theme.tokens.json` (DTCG) is the only source. `tools/theme/tokens.mjs` turns it into `assets/css/tokens.css` (committed, drift-checked). The head include writes `_config.yml` overrides as `:root` variables. Plain CSS, no Sass, no build step on Pages.

**Tech Stack:** Node 22 `node:test`, Jekyll (GitHub Pages gem), plain CSS (`@layer`, `oklch`, `light-dark`, `@property`), `ajv` (devDependency) for JSON Schema.

**Spec:** `docs/superpowers/specs/2026-10-22-theme-tokens-design.md`

## Global Constraints

- One issue = one branch = one PR with `Closes #N`; merge after local `npm run check` is green and CI is green.
- Logical CSS properties only (`margin-inline-start`, never `margin-left`).
- No JavaScript is needed to read a page; theme JS stays tiny (the inline init script under 400 bytes).
- Content and config must not depend on Jekyll (the override map lives in a plain JS/JSON file; the Liquid include only renders it).
- Jekyll skips files starting with `_`, so the generated stylesheet is `assets/css/tokens.css`.
- Palette values are exactly those in the spec table; every text token pair is at least WCAG AA 4.5:1 (large text 3:1).
- Do not edit `plugins/`-style generated output by hand; regenerate with `npm run build:tokens`.
- Never publish packages or change repository settings.

## Review Focus

- A `_config.yml` override with an invalid color (`accent: "red;}body{display:none"`) is rejected by the schema and never reaches the CSS (no style injection).
- Unknown override keys produce a build-time failure, not silent ignore.
- Stored theme value is garbage (`localStorage` = `"purple"` or storage throws): page falls back to auto and still renders.
- `light-dark()` unsupported browser or no JS: page remains readable in light colors.
- A site with no `slipway:` config block renders the default palette.

---

### Task 1: Token scale (#4)

**Files:**
- Create: `tokens/theme.tokens.json`, `tools/theme/tokens.mjs`, `tools/theme/tokens.test.mjs`, `tools/theme/tokens-build.mjs`, `assets/css/tokens.css` (generated), `docs/adr/0008-theme-palette.md`
- Modify: `package.json` (scripts `build:tokens`, `check:tokens`; add `check:tokens` to `check`; add `tools/theme/tokens.test.mjs` is already covered by the `tools/theme/*.test.mjs` glob), `assets/css/slipway.css` (consume variables), `_includes/head.html` (link `tokens.css` before `slipway.css`)

**Interfaces:**
- Produces: `loadTokens(path: string): TokenFile`; `resolveToken(tokens: TokenFile, name: string, mode: "light" | "dark"): string` (hex or css value, aliases followed); `listTokens(tokens: TokenFile): { name: string; type: string; light: string; dark: string }[]`; `buildCss(tokens: TokenFile): string`; CLI `node tools/theme/tokens-build.mjs [--check]` (exit 1 when `assets/css/tokens.css` differs).
- CSS variable names: `--sl-color-{canvas,surface,text,heading,muted,line,rose,rose-fill,on-rose-fill}`, `--sl-font-{display,body,mono,persian}`, `--sl-step-{-1,0,1,2,3,4}` (fluid `clamp()`), `--sl-space-{1,2,3,4,6,8,12,16}` (4px grid in `rem`), `--sl-radius-{compact,card}`, `--sl-measure`.

- [ ] **Step 1: Write failing tests** in `tools/theme/tokens.test.mjs`: `resolveToken(t,"color.text","light") === "#3b3330"`, `("color.text","dark") === "#b9b2b0"`, `("color.rose","light") === "#7a4f4f"`, `("color.canvas","dark") === "#262425"` (all spec values); `buildCss` output contains `color-scheme: light dark`, `--sl-color-text: light-dark(#3b3330, #b9b2b0)`, and starts inside `@layer tokens`; a `{color.rose}` alias in a component token resolves to the same value.
- [ ] **Step 2: Run** `node --test tools/theme/tokens.test.mjs`; expect FAIL (module missing).
- [ ] **Step 3: Write `tokens/theme.tokens.json`** with three tiers (primitive, semantic, component) using DTCG `$type`/`$value`; mode values in `$extensions.slipway.dark`. Implement `tokens.mjs` and `tokens-build.mjs` (signatures above); alias syntax `{group.name}`; unresolved alias throws.
- [ ] **Step 4: Add a drift test**: `tokens-build.mjs --check` fails when `tokens.css` is edited by hand (test writes to a temp copy). Run `npm run build:tokens`; run tests; expect PASS.
- [ ] **Step 5: Wire CSS.** `slipway.css` uses the variables for body, `main` (`max-inline-size: var(--sl-measure)`), links, `code`, `hr`; `@layer reset, tokens, base, components, utilities;` declared first in `tokens.css`. Add the two typed `@property` declarations for `--sl-space-*` only if the generator emits them; otherwise skip.
- [ ] **Step 6: ADR 0008** (`docs/adr/0008-theme-palette.md`): status Accepted, context (ADR 0005 is the logo palette; the theme palette is desert rose on sand/charcoal for low glare), the palette table from the spec with measured contrast, consequence (bronze is not used in the theme).
- [ ] **Step 7: Verify** `npm run check`; expect exit 0 (site step may skip if Ruby 3.3 is missing, say so). Commit on branch `theme/4-token-scale`, open PR `Closes #4`, merge after green CI.

### Task 2: Config tokens to CSS variables with JSON Schema (#6)

**Files:**
- Create: `schemas/slipway-config.schema.json`, `tools/theme/config-map.mjs`, `tools/theme/config.test.mjs`, `_includes/theme-vars.html`
- Modify: `_includes/head.html` (include `theme-vars.html` after `tokens.css`), `examples/minimal/_config.yml` (add a commented `slipway.tokens` sample), `package.json` (`ajv` devDependency)

**Interfaces:**
- Consumes: variable names from Task 1.
- Produces: config shape `slipway: { tokens: { accent, canvas, text, font_display, font_body, radius } }` (the top-level `theme:` key stays Jekyll's theme name); `configMap: Record<string, string>` mapping key to CSS variable (`accent` to `--sl-color-rose`, `canvas` to `--sl-color-canvas`, `text` to `--sl-color-text`, `font_display` to `--sl-font-display`, `font_body` to `--sl-font-body`, `radius` to `--sl-radius-card`); `validateConfig(config: unknown): { ok: boolean; errors: string[] }`.

- [ ] **Step 1: Failing tests** (`config.test.mjs`): valid `{slipway:{tokens:{accent:"#8a4f55"}}}` is ok; `accent: "red;}body{display:none"` is not ok; unknown key `colour` is not ok (`additionalProperties: false`); the key set of `configMap`, the schema `properties`, and the `{% if site.slipway.tokens.<key> %}` lines in `_includes/theme-vars.html` are identical.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** the schema (colors: `^#[0-9a-fA-F]{6}$` or `oklch(...)` pattern; fonts: a safe font-stack pattern without `;{}`), `validateConfig` with ajv, `config-map.mjs`, and the include emitting one `<style>:root{...}</style>` only when at least one key is set.
- [ ] **Step 4: Run tests, expect PASS.** Add `check:site` coverage: `tools/theme/check.mjs` validates `examples/*/_config.yml` against the schema (parse YAML with the `yaml` devDependency or the existing parser if the repo has one).
- [ ] **Step 5: Exit-criterion test** (no Ruby needed): a unit test renders the override map for `{accent, canvas, font_display}` and asserts three `:root` declarations.
- [ ] **Step 6: Verify and ship** as Task 1 step 7; branch `theme/6-config-tokens`, `Closes #6`.

### Task 3: Dark mode without flash, manual toggle (#5)

**Files:**
- Create: `assets/js/theme-toggle.js`, `_includes/theme-init.html`, `tools/theme/theme-mode.test.mjs`
- Modify: `_includes/head.html` (init script first in `<head>`), `_layouts/default.html` (toggle button in a `<header>`), `assets/css/tokens.css` via generator (selectors `html[data-theme="light"]`/`"dark"` set `color-scheme`), `assets/css/slipway.css` (button styles, `@view-transition`-guarded transition)

**Interfaces:**
- Produces: `resolveMode(stored: string | null, systemDark: boolean): "light" | "dark" | "auto"` in `assets/js/theme-mode.js` (pure, no DOM, importable by node); inline init under 400 bytes sets `document.documentElement.dataset.theme` to `"light"` or `"dark"` only when stored, otherwise removes it; storage key `slipway-theme`.

- [ ] **Step 1: Failing tests:** `resolveMode("dark", false) === "dark"`, `resolveMode("purple", true) === "auto"`, `resolveMode(null, true) === "auto"`; storage that throws does not throw (wrap in try/catch, test with a stub); `_includes/theme-init.html` byte length is under 400.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement** the three states (auto, light, dark) cycling on click; toggle button has `aria-pressed`-style label text updated per state; View Transitions only when `document.startViewTransition` exists and `prefers-reduced-motion` is not `reduce`. Without JS the page follows the system through `light-dark()`.
- [ ] **Step 4: Run tests, expect PASS;** run the built example (when Ruby is available) and confirm the init script is the first script in `<head>`.
- [ ] **Step 5: Verify and ship:** branch `theme/5-dark-mode`, `Closes #5`.

### Task 4: Editorial signature (#7)

**Files:**
- Create: `assets/fonts/*.woff2`, `assets/fonts/LICENSES/*`, `assets/css/fonts.css`, `tools/theme/fonts.test.mjs`
- Modify: `assets/css/slipway.css` (headings, numbered sections, hairline rules), `tokens/theme.tokens.json` (font stacks, `rule.width`), `_includes/head.html` (preload only the first font a page needs)

**Interfaces:**
- Consumes: `--sl-font-display/body/persian`, `--sl-color-line`.
- Produces: classes/attributes `.sl-sections` (CSS counter container, `h2` gets a two-digit counter via `::before`), `.sl-rule` (1px hairline in `--sl-color-line`).

- [ ] **Step 1: Failing tests:** every `src: url(...)` in `fonts.css` exists on disk; every font family has a license file in `assets/fonts/LICENSES/`; total woff2 for the default Persian page is at most 130 KB (ADR 0004); `font-display: swap` appears for each face; no `margin-left`/`padding-right` style physical properties in `slipway.css`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Self-host fonts** per ADR 0004 (Instrument Serif regular, Source Serif 4 variable roman and italic, Vazirmatn variable Arabic and Latin subsets) from Fontsource packages installed in a scratch folder (OFL-1.1); write `fonts.css` with `unicode-range` splits and `size-adjust` fallbacks left to a follow-up as ADR 0004 says.
- [ ] **Step 4: Implement** the editorial styles; run tests, expect PASS.
- [ ] **Step 5: Verify and ship:** branch `theme/7-editorial-signature`, `Closes #7`.

### Task 5: WCAG AA test for every text token pair (#56)

**Files:**
- Create: `tools/theme/contrast.mjs`, `tools/theme/contrast.test.mjs`
- Modify: `tokens/theme.tokens.json` (declare `$extensions.slipway.pairs`: a list of `[foreground, background, kind]` with `kind` `"text" | "large" | "ui"`), `package.json` (`check:contrast`, included in `check`)

**Interfaces:**
- Consumes: `resolveToken`, `listTokens` from Task 1.
- Produces: `contrastRatio(fg: string, bg: string): number` (WCAG 2.x relative luminance, hex input), `apca(fg: string, bg: string): number` (reported only), `checkPairs(tokens: TokenFile): { pair: string; mode: string; ratio: number; required: number; ok: boolean }[]`.

- [ ] **Step 1: Failing tests:** `contrastRatio("#000000","#ffffff")` is 21 (`toFixed(2)`); `contrastRatio("#3b3330","#e9e1d6")` rounds to 9.52 range (between 9.4 and 9.6); `checkPairs` on the default tokens has no `ok: false` in either mode; a copy of the tokens with `color.rose` light set to `#d4a29c` yields at least one `ok: false` (proves the test can fail).
- [ ] **Step 2: Run, expect FAIL; implement; run, expect PASS.**
- [ ] **Step 3: Print a table** (pair, mode, ratio, APCA) from `node tools/theme/contrast.mjs`; exits 1 on any failure; APCA never fails the run.
- [ ] **Step 4: Verify and ship:** branch `theme/56-contrast-test`, `Closes #56`. Fix any real failure by adjusting the surface token, not by lowering the requirement.

### Task 6: Document every token (#8)

**Files:**
- Create: `docs/tokens.md` (generated), `tools/theme/tokens-docs.test.mjs`
- Modify: `tools/theme/tokens-build.mjs` (also writes/checks `docs/tokens.md`), `tokens/theme.tokens.json` (`$description` on every token)

**Interfaces:**
- Consumes: `listTokens`.
- Produces: `buildTokenDocs(tokens: TokenFile): string` (markdown table: name, CSS variable, purpose, light, dark; plus the `slipway.tokens` override keys from `configMap`).

- [ ] **Step 1: Failing tests:** every token in `listTokens` has a non-empty `$description` (lists the offenders); `docs/tokens.md` contains each CSS variable; `--check` fails when the doc is stale.
- [ ] **Step 2: Run, expect FAIL; implement; run, expect PASS.**
- [ ] **Step 3: Verify and ship:** branch `theme/8-token-docs`, `Closes #8`.

### Task 7: Print stylesheet (#57)

**Files:**
- Create: `assets/css/print.css`, `tools/theme/print.test.mjs`
- Modify: `_includes/head.html` (`<link rel="stylesheet" media="print" ...>`), `docs/modes.md` only if a table column changes

**Interfaces:**
- Consumes: token variables.
- Produces: print rules that force the light palette, hide `header`, `nav`, and the theme toggle, show link URLs after links (`a[href^="http"]::after`), avoid breaks inside `pre` and after headings.

- [ ] **Step 1: Failing tests:** `print.css` contains `@media print` or is linked with `media="print"`; forces `color-scheme: light`; hides `.sl-theme-toggle`; includes `break-after: avoid` for headings; uses no physical left/right properties.
- [ ] **Step 2: Run, expect FAIL; implement; run, expect PASS.**
- [ ] **Step 3: Verify and ship:** branch `theme/57-print`, `Closes #57`.

### Task 8: Close the epic

**Files:**
- Modify: `ROADMAP.md` (tick the exit criterion, as the previous epics did)

- [ ] **Step 1:** Confirm the exit criterion with a test: changing `accent`, `canvas`, `font_display` in an example config changes three `:root` declarations, and `npm run check:contrast` is green. Edit `ROADMAP.md` the way commits `docs(roadmap): tick the exit criterion ...` did, run `npm run check`, open PR for epic #3 (`Closes #3`), merge.
