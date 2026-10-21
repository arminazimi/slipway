// Reads tokens/theme.tokens.json (W3C Design Tokens format) and turns it into CSS custom properties.
//   node tools/theme/tokens-build.mjs [--check]
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const tokensPath = join(root, "tokens/theme.tokens.json");
const alias = /^\{([^}]+)\}$/;

export function loadTokens(path = tokensPath) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const isToken = (node) => node && typeof node === "object" && "$value" in node;

function find(tokens, name) {
  let node = tokens;
  for (const part of name.split(".")) {
    node = node && typeof node === "object" ? node[part] : undefined;
  }
  if (!isToken(node)) throw new Error(`unknown token "${name}"`);
  return node;
}

/** The value of `name` for a mode, with `{aliases}` followed. */
export function resolveToken(tokens, name, mode, seen = []) {
  if (seen.includes(name)) throw new Error(`alias cycle at "${name}"`);
  const node = find(tokens, name);
  const value = (mode === "dark" && node.$extensions?.slipway?.dark) || node.$value;
  const match = alias.exec(value);
  return match ? resolveToken(tokens, match[1], mode, [...seen, name]) : String(value);
}

/** Every token in file order: its dotted name, type, description, and light and dark values. */
export function listTokens(tokens) {
  const out = [];
  const walk = (node, path) => {
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      const name = [...path, key].join(".");
      if (isToken(child)) {
        out.push({
          name,
          type: child.$type,
          description: child.$description ?? "",
          light: resolveToken(tokens, name, "light"),
          dark: resolveToken(tokens, name, "dark"),
        });
      } else walk(child, [...path, key]);
    }
  };
  walk(tokens, []);
  return out;
}

/** The CSS variable for a token name: color.text -> --sl-color-text. */
export const cssVar = (name) => `--sl-${name.replaceAll(".", "-")}`;

/** The tokens that become CSS variables: everything except the primitive tier. */
export const exposedTokens = (tokens) => listTokens(tokens).filter((t) => !t.name.startsWith("primitive."));

export function buildCss(tokens) {
  const lines = exposedTokens(tokens).map(({ name, type, light, dark }) => {
    const value = type === "color" && light !== dark ? `light-dark(${light}, ${dark})` : light;
    return `    ${cssVar(name)}: ${value};`;
  });
  return `/* Generated from tokens/theme.tokens.json by tools/theme/tokens-build.mjs. Do not edit. */
@layer reset, tokens, base, components, utilities;

@layer tokens {
  :root {
    color-scheme: light dark;
${lines.join("\n")}
  }

  :root[data-theme="light"] {
    color-scheme: light;
  }

  :root[data-theme="dark"] {
    color-scheme: dark;
  }
}
`;
}
