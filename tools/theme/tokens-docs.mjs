// Builds docs/tokens.md from tokens/theme.tokens.json and the _config.yml override map.
import { configMap } from "./config-map.mjs";
import { cssVar, listTokens } from "./tokens.mjs";

const groups = {
  color: "Color",
  font: "Fonts",
  step: "Type scale",
  space: "Spacing",
  radius: "Radius",
  button: "Button (component tokens)",
  primitive: "Primitive values",
};
const cell = (text) => String(text).replaceAll("|", "\\|");
const code = (text) => `\`${cell(text)}\``;

export function buildTokenDocs(tokens) {
  const all = listTokens(tokens);
  const byGroup = Map.groupBy(all, (t) => t.name.split(".")[0]);
  const sections = [...byGroup].map(([group, items]) => {
    const rows = items.map((t) => {
      const variable = t.name.startsWith("primitive.") ? "(not exposed)" : code(cssVar(t.name));
      const dark = t.dark === t.light ? "same" : code(t.dark);
      return `| ${code(t.name)} | ${variable} | ${cell(t.description)} | ${code(t.light)} | ${dark} |`;
    });
    return `## ${groups[group] ?? group[0].toUpperCase() + group.slice(1)}\n\n| Token | CSS variable | Purpose | Light | Dark |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}`;
  });
  const overrides = Object.entries(configMap).map(([key, vars]) => `| ${code(key)} | ${vars.map(code).join(", ")} |`);
  return `<!-- Generated from tokens/theme.tokens.json by tools/theme/tokens-build.mjs. Do not edit. -->
# Theme tokens

Every visual decision in the theme is a CSS custom property, defined once in \`tokens/theme.tokens.json\` and generated into \`assets/css/tokens.css\`. After editing the JSON, run \`npm run build:tokens\`; \`npm run check\` fails when the CSS or this page is out of date.

Colors use \`light-dark()\`, so each one is written once and follows the system or the reader's choice of light or dark. Primitive values are the palette; semantic and component tokens point at them and are the ones you restyle.

## Change tokens from \`_config.yml\`

\`\`\`yaml
slipway:
  tokens:
    accent: "#7a4f4f"
\`\`\`

| Key | Sets |
| --- | --- |
${overrides.join("\n")}

An override applies to both light and dark, so check its contrast in both. The schema is \`schema/slipway-config.schema.json\`.

${sections.join("\n\n")}
`;
}
