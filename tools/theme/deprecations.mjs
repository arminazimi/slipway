// Warns about deprecated config keys and front-matter fields in a site (ADR 0012, rule 4), naming the
// replacement. It never fails: a deprecated name keeps working until the release in `removed_in`.
// The list is schema/deprecations.json; _includes/compat.html makes the layouts read the old names.
// The finder lives in packages/doctor (`slipway/deprecations`), shared with `slipway doctor`.
// Usage: node tools/theme/deprecations.mjs <site dir> [--list <deprecations.json>]
import Ajv2020 from "ajv/dist/2020.js";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findDeprecations } from "slipway/deprecations";
import { root } from "./tokens.mjs";

export const defaultList = join(root, "schema/deprecations.json");
const schema = JSON.parse(readFileSync(join(root, "schema/deprecations.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

export { findDeprecations };

/** The entries of a deprecations file; throws when it does not match schema/deprecations.schema.json. */
export function loadDeprecations(path = defaultList) {
  const list = JSON.parse(readFileSync(path, "utf8"));
  if (!validate(list)) throw new Error(`${path}: ${validate.errors.map((e) => `${e.instancePath || "/"} ${e.message}`).join("; ")}`);
  return list.deprecations;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const at = args.indexOf("--list");
  const list = at >= 0 ? resolve(args.splice(at, 2)[1]) : defaultList;
  const dir = resolve(args[0] ?? ".");
  const found = findDeprecations(dir, loadDeprecations(list));
  for (const { message } of found) console.log(message);
  if (!found.length) console.log(`no deprecated keys in ${dir}`);
}
