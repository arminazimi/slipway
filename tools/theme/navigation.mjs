// Validates every examples/<name>/_data/navigation.yml against schema/navigation.schema.json.
import Ajv2020 from "ajv/dist/2020.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { root } from "./tokens.mjs";

const schema = JSON.parse(readFileSync(join(root, "schema/navigation.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

export function validateNavigation(data) {
  const ok = validate(data ?? {});
  const errors = (validate.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
  return { ok, errors };
}

/** Problems in every examples/<name>/_data/navigation.yml under `dir`. */
export function validateExampleNavigation(dir = join(root, "examples")) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "_data/navigation.yml")))
    .flatMap((entry) => {
      const { ok, errors } = validateNavigation(parse(readFileSync(join(dir, entry.name, "_data/navigation.yml"), "utf8")));
      return ok ? [] : errors.map((e) => `examples/${entry.name}/_data/navigation.yml: ${e}`);
    });
}
