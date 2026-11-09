// Which CSS variables each `slipway.tokens` key in _config.yml overrides.
// _includes/theme-vars.html renders the same keys; config.test.mjs keeps the two in step.
export const configMap = {
  accent: ["--sl-color-rose", "--sl-color-rose-fill"],
  canvas: ["--sl-color-canvas"],
  text: ["--sl-color-text"],
  font_display: ["--sl-font-display"],
  font_body: ["--sl-font-body"],
  radius: ["--sl-radius-card"],
};

/** The `:root` declarations for a `slipway.tokens` object, in configMap order. */
export function renderOverrides(tokens = {}) {
  return Object.entries(configMap)
    .filter(([key]) => tokens[key] !== undefined)
    .flatMap(([key, vars]) => vars.map((name) => `${name}: ${tokens[key]};`));
}
