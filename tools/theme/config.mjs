// Validates the `slipway` block of a _config.yml against schema/slipway-config.schema.json.
import Ajv2020 from "ajv/dist/2020.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { root } from "./tokens.mjs";

const schema = JSON.parse(readFileSync(join(root, "schema/slipway-config.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

export function validateConfig(config) {
  const ok = validate(config ?? {});
  const errors = (validate.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
  return { ok, errors };
}

/** Problems in every examples/<name>/_config.yml under `dir`. */
export function validateExampleConfigs(dir = join(root, "examples")) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "_config.yml")))
    .flatMap((entry) => {
      const { ok, errors } = validateConfig(parse(readFileSync(join(dir, entry.name, "_config.yml"), "utf8")));
      return ok ? [] : errors.map((e) => `examples/${entry.name}/_config.yml: ${e}`);
    });
}
