import { realpathSync } from "node:fs";
import { insideSite } from "../tools.ts";
import { CONFIG_FILE, loadConfig } from "../../../engine/src/config/load.ts";

export const definition = {
  name: "read_config",
  description: "Read the site's mizzen.yml (or another YAML config inside the site) and validate it with the engine's config loader, which names the line of every problem.",
  inputSchema: {
    type: "object",
    properties: {
      file: { type: "string", description: "Config file, relative to the site directory.", default: CONFIG_FILE },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true },
};

/** The site's config file, loaded and validated the way `slipway build` loads it (ADR 0024). */
export function readConfig(site, file = CONFIG_FILE) {
  if (!/\.ya?ml$/.test(file)) throw new Error(`${file} is not a YAML config file`);
  const path = insideSite(site, file);
  const { config, diagnostics } = loadConfig(realpathSync(site), { path });
  return { file, valid: diagnostics.length === 0, diagnostics, config };
}

export const handler = (site, args) => readConfig(site, args.file ?? CONFIG_FILE);
