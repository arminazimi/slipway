import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Document, parseDocument } from "yaml";

export const definition = {
  name: "set_token",
  description: "Set a theme token in _config.yml.",
  inputSchema: {
    type: "object",
    properties: {
      token: { type: "string", description: "Token name (e.g. accent, canvas)." },
      value: { type: "string", description: "Token value (e.g. a color)." },
    },
    required: ["token", "value"],
    additionalProperties: false,
  },
};

/** Sets a token in _config.yml. */
export function setToken(site, { token, value }) {
  const base = realpathSync(site);
  const file = resolve(base, "_config.yml");
  let doc;
  if (existsSync(file)) {
    doc = parseDocument(readFileSync(file, "utf8"));
  } else {
    doc = new Document({});
  }

  if (!doc.has("slipway")) doc.set("slipway", doc.createNode({}));
  let slipway = doc.get("slipway");
  if (!slipway) { doc.set("slipway", doc.createNode({})); slipway = doc.get("slipway"); }
  if (typeof slipway.has === "function" && !slipway.has("tokens")) slipway.set("tokens", doc.createNode({}));
  const tokens = slipway.get ? slipway.get("tokens") : null;
  if (tokens && typeof tokens.set === "function") {
    tokens.set(token, value);
  }

  writeFileSync(file, doc.toString());
  return { status: "set", token, value };
}

export const handler = (site, args) => setToken(site, args);
