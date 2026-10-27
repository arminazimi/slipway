import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { validateConfig } from "../../../../tools/theme/config.mjs";
import { insideSite } from "../tools.mjs";

export const definition = {
  name: "read_config",
  description: "Read the site's _config.yml (or another YAML config inside the site) and validate it against Slipway's config schema.",
  inputSchema: {
    type: "object",
    properties: {
      file: { type: "string", description: "Config file, relative to the site directory.", default: "_config.yml" },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

/** The site's config file parsed and checked against schema/slipway-config.schema.json. */
export function readConfig(site, file = "_config.yml") {
  if (!/\.ya?ml$/.test(file)) throw new Error(`${file} is not a YAML config file`);
  const path = insideSite(site, file);
  let config;
  try {
    config = parse(readFileSync(path, "utf8")) ?? {};
  } catch (error) {
    throw new Error(`${file} is not valid YAML: ${error.message}`);
  }
  const { ok, errors } = validateConfig(config);
  return { file, valid: ok, errors, config };
}

export const handler = (site, args) => readConfig(site, args.file ?? "_config.yml");
