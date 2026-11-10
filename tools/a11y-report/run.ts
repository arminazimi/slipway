// Builds site/accessibility.md, the WCAG 2.2 AA conformance page, from what the gates test (#1259).
//   node tools/a11y-report/run.ts --write   write the page
//   node tools/a11y-report/run.ts           fail when the page is stale (npm run check runs this)
// The axe gate (tools/axe) audits one page per layout and per component in light and dark; the keyboard gate
// (tools/keyboard) walks the keyboard flows; the rtl and contrast gates cover direction and color. The counts below
// are read from the theme's folders, so adding a layout or component changes the page and the check asks for a rewrite.
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const reportPath = join(root, "site/accessibility.md");

/** How a criterion is checked: by an automated gate, by a gate plus a person, or by a person alone. */
export type Method = "axe" | "keyboard" | "contrast" | "rtl" | "hand";

export interface Criterion {
  sc: string;
  name: string;
  level: "A" | "AA";
  methods: Method[];
  note: string;
}

export const criteria: Criterion[] = [
  { sc: "1.1.1", name: "Non-text content", level: "A", methods: ["axe"], note: "axe checks text alternatives; whether an alternative is meaningful is read by a person." },
  { sc: "1.3.1", name: "Info and relationships", level: "A", methods: ["axe"], note: "Landmarks, headings, lists, and table markup." },
  { sc: "1.3.2", name: "Meaningful sequence", level: "A", methods: ["keyboard", "hand"], note: "The keyboard gate follows the reading order; a person checks it with a screen reader." },
  { sc: "1.4.1", name: "Use of color", level: "A", methods: ["axe"], note: "Links in text are underlined or otherwise marked." },
  { sc: "1.4.3", name: "Contrast (minimum)", level: "AA", methods: ["contrast", "axe"], note: "Every color pair of the tokens is checked at 4.5:1 (3:1 for large text), in light and dark." },
  { sc: "1.4.4", name: "Resize text", level: "AA", methods: ["hand"], note: "Sizes are in rem; checked by hand at 200%." },
  { sc: "1.4.10", name: "Reflow", level: "AA", methods: ["hand"], note: "Checked by hand at a 320 px wide window: nothing may scroll sideways." },
  { sc: "1.4.11", name: "Non-text contrast", level: "AA", methods: ["contrast"], note: "Focus rings and interface marks are checked at 3:1." },
  { sc: "1.4.12", name: "Text spacing", level: "AA", methods: ["hand"], note: "Checked by hand with a text-spacing override." },
  { sc: "1.4.13", name: "Content on hover or focus", level: "AA", methods: ["keyboard", "hand"], note: "Popovers open on focus and close with Escape." },
  { sc: "2.1.1", name: "Keyboard", level: "A", methods: ["keyboard"], note: "Skip link, sidebar, search, drawer, and code tabs." },
  { sc: "2.1.2", name: "No keyboard trap", level: "A", methods: ["keyboard"], note: "The drawer and the search dialog trap focus only while open, and return it on close." },
  { sc: "2.4.1", name: "Bypass blocks", level: "A", methods: ["keyboard", "axe"], note: "A skip link is the first stop." },
  { sc: "2.4.3", name: "Focus order", level: "A", methods: ["keyboard"], note: "The gate checks which element has focus at each step." },
  { sc: "2.4.7", name: "Focus visible", level: "AA", methods: ["keyboard"], note: "The gate checks that the focus ring is visible at each step." },
  { sc: "2.4.11", name: "Focus not obscured (minimum)", level: "AA", methods: ["hand"], note: "Sticky header and sidebar are checked by hand against a focused link." },
  { sc: "2.5.8", name: "Target size (minimum)", level: "AA", methods: ["axe"], note: "axe's target-size rule." },
  { sc: "3.1.1", name: "Language of page", level: "A", methods: ["axe", "rtl"], note: "Every page sets lang and dir; the rtl gate checks Persian pages." },
  { sc: "3.1.2", name: "Language of parts", level: "AA", methods: ["rtl", "hand"], note: "Mixed-direction text is isolated; a person checks the wording." },
  { sc: "3.2.3", name: "Consistent navigation", level: "AA", methods: ["hand"], note: "One layout renders the navigation on every page." },
  { sc: "4.1.2", name: "Name, role, value", level: "A", methods: ["axe", "keyboard"], note: "Names and roles of controls." },
];

const methodLabel: Record<Method, string> = {
  axe: "axe (tools/axe)",
  keyboard: "keyboard gate (tools/keyboard)",
  contrast: "contrast gate (tools/theme)",
  rtl: "rtl gate (tools/rtl)",
  hand: "by hand",
};

/** The names of the folders in a theme directory. */
function folders(dir: string): string[] {
  return readdirSync(join(root, dir)).filter((name) => statSync(join(root, dir, name)).isDirectory()).sort();
}

/** The layouts: one `.ts` file each, except the shared base. */
function layouts(): string[] {
  return readdirSync(join(root, "packages/theme/layouts"))
    .filter((name) => name.endsWith(".ts") && name !== "base.ts" && !name.endsWith(".test.ts"))
    .map((name) => name.slice(0, -3))
    .sort();
}

export function buildReport(): string {
  const comps = folders("packages/theme/components");
  const lays = layouts();
  const auto = criteria.filter((c) => c.methods.some((m) => m !== "hand")).length;
  const handOnly = criteria.filter((c) => c.methods.every((m) => m === "hand"));
  const rows = criteria.map(
    (c) => `| ${c.sc} | ${c.name} | ${c.level} | ${c.methods.map((m) => methodLabel[m]).join(", ")} | ${c.note} |`,
  );
  return `---
title: Accessibility
description: How Slipway's theme is tested against WCAG 2.2 AA, and what is checked by hand.
layout: doc
permalink: /accessibility/
---
<!-- Generated by tools/a11y-report/run.ts. Do not edit below this line. -->

This page lists the WCAG 2.2 success criteria at levels A and AA that the Lateen theme is tested against, and how each is tested. It is written from the gates in this repository and published with each release. It is not an audit by a third party.

## What the gates cover

- **axe** audits one page for each of the ${lays.length} layouts (${lays.join(", ")}) and each of the ${comps.length} components, in light and dark, and fails on any violation.
- **The keyboard gate** walks the skip link, the sidebar, search, the mobile drawer, and code tabs, and checks the focused element and a visible focus ring at each step.
- **The contrast gate** checks every color pair of the tokens in both modes.
- **The rtl gate** checks direction, language, and mirrored icons on right-to-left pages.

## Criteria

${auto} of ${criteria.length} criteria have an automated check. ${handOnly.length} are checked only by hand: ${handOnly.map((c) => c.sc).join(", ")}. Automated tools find only part of the problems for any criterion, so a person still reviews each release.

| Criterion | Name | Level | Tested by | Notes |
| --- | --- | --- | --- | --- |
${rows.join("\n")}

## Report a problem

If something on a Slipway site is hard to use, open an issue in the [repository](https://github.com/arminazimi/slipway/issues).
`;
}

export function main(args = process.argv.slice(2)): number {
  const expected = buildReport();
  if (args.includes("--write")) {
    writeFileSync(reportPath, expected);
    console.log(`wrote ${reportPath}`);
    return 0;
  }
  let actual: string | null = null;
  try { actual = readFileSync(reportPath, "utf8"); } catch {}
  if (actual !== expected) {
    console.error(`${reportPath} is stale; run node tools/a11y-report/run.ts --write`);
    return 1;
  }
  console.log("OK a11y-report: site/accessibility.md matches the gates");
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = main();
