// Validates a sourcemap.json against schema/sourcemap.schema.json, plus the rule JSON Schema cannot express: each url once.
import Ajv2020 from "ajv/dist/2020.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./tokens.mjs";

const schema = JSON.parse(readFileSync(join(root, "schema/sourcemap.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

export function validateSourcemap(data) {
  const errors = validate(data) ? [] : validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`);
  const seen = new Set();
  for (const [i, page] of (Array.isArray(data?.pages) ? data.pages : []).entries()) {
    if (typeof page?.url !== "string") continue;
    if (seen.has(page.url)) errors.push(`/pages/${i}/url ${page.url} appears more than once`);
    seen.add(page.url);
  }
  return { ok: errors.length === 0, errors };
}
