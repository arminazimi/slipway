import { h } from "preact";
import type { Chrome } from "@velella/mizzen/contracts";

const LABEL = "Color theme";

/** The three choices, in the order the switch shows them; `client.ts` stores them verbatim. */
const OPTIONS = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
] as const;

/** The icon drawn for each choice: a sun, a screen, and a moon. */
function icon(value: (typeof OPTIONS)[number]["value"]) {
  const paths =
    value === "light"
      ? [h("circle", { cx: "12", cy: "12", r: "4" }), h("path", { d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" })]
      : value === "dark"
        ? [h("path", { d: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" })]
        : [h("rect", { x: "3", y: "4", width: "18", height: "12", rx: "2" }), h("path", { d: "M8 20h8M12 16v4" })];
  return h("svg", { class: "theme-toggle-icon", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" }, ...paths);
}

/**
 * The theme switch. Hidden until `client.ts` runs, so a visitor without JavaScript never sees a
 * control that would do nothing. Native radios inside a fieldset give the group name, the three
 * choices, and arrow-key navigation without any script of their own; the `role=status` region is
 * where `client.ts` announces every change.
 */
const themeToggle: Chrome = () =>
  h(
    "fieldset",
    { class: "theme-toggle", "data-theme-toggle": true, hidden: true },
    h("legend", { class: "theme-toggle-legend" }, LABEL),
    h(
      "div",
      { class: "theme-toggle-options" },
      ...OPTIONS.map((option) =>
        h(
          "label",
          { class: "theme-toggle-option" },
          h("input", { class: "theme-toggle-input", type: "radio", name: "color-theme", value: option.value }),
          icon(option.value),
          h("span", { class: "theme-toggle-option-text" }, option.label),
        ),
      ),
    ),
    h("p", { class: "theme-toggle-status", role: "status" }, ""),
  );

export default themeToggle;
