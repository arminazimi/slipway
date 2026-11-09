import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Document, isMap, parseDocument } from "yaml";
import { CONFIG_FILE } from "../../../engine/src/config/load.ts";
import { outside } from "../tools.ts";

export const definition = {
  name: "set_token",
  description: "Set a theme token override (theme.options.tokens) in the site's mizzen.yml, keeping the comments and key order of the file.",
  inputSchema: {
    type: "object",
    properties: {
      token: { type: "string", description: "Token name (e.g. accent, canvas)." },
      value: { type: "string", description: "Token value (e.g. a color)." },
      file: { type: "string", description: "Config file, relative to the site directory.", default: CONFIG_FILE },
    },
    required: ["token", "value"],
    additionalProperties: false,
  },
};

/** Sets `theme.options.tokens.<token>` in the config file (ADR 0024: the 0.2 `slipway.tokens` overrides), keeping comments and key order. */
export function setToken(site, { token, value, file = CONFIG_FILE }) {
  if (!/\.ya?ml$/.test(file)) throw new Error(`${file} is not a YAML config file`);
  const base = realpathSync(site);
  const path = resolve(base, file);
  if (outside(base, path)) throw new Error(`${file} is outside the site directory`);
  if (existsSync(path) && outside(base, realpathSync(path))) throw new Error(`${file} is outside the site directory`);

  let doc;
  if (existsSync(path)) {
    doc = parseDocument(readFileSync(path, "utf8"));
  } else {
    doc = new Document({});
  }

  const theme = ensureMap(doc, doc, "theme");
  const options = ensureMap(doc, theme, "options");
  const tokens = ensureMap(doc, options, "tokens");
  tokens.set(token, value);

  writeFileSync(path, doc.toString());
  return { status: "set", file, token, value };
}

/** The map at `key`, created (or a non-map replaced) so a set can land inside it. */
function ensureMap(doc, parent, key) {
  if (!parent.has(key) || !isMap(parent.get(key))) parent.set(key, doc.createNode({}));
  return parent.get(key);
}

export const handler = (site, args) => setToken(site, args);
