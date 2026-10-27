// Validates a _config.yml against schema/slipway-config.schema.json and keeps the schema in step with the layouts.
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

// site.* variables that Jekyll computes rather than reads from _config.yml; data files have their own schemas.
const computed = new Set(["github", "repository_url", "categories", "collections", "data", "documents", "html_pages", "pages", "posts", "related_posts", "static_files", "tags", "time"]);
const liquidMethods = new Set(["first", "last", "size"]);

function hasPath(node, path) {
  if (path.length === 0) return true;
  if (node.$ref) node = { ...schema.$defs[node.$ref.split("/").pop()], ...node, $ref: undefined };
  if (node.anyOf && node.anyOf.some((alt) => hasPath(alt, path))) return true;
  const child = node.properties?.[path[0]];
  return child ? hasPath(child, path.slice(1)) : false;
}

/** `site.*` keys read under the given folders (default _layouts and _includes) that the schema does not describe. */
export function undocumentedSiteKeys(dirs = [join(root, "_layouts"), join(root, "_includes")]) {
  const keys = new Set();
  for (const dir of dirs) {
    for (const name of readdirSync(dir).filter((file) => file.endsWith(".html"))) {
      for (const match of readFileSync(join(dir, name), "utf8").matchAll(/\bsite\.([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/g)) {
        keys.add(match[1]);
      }
    }
  }
  return [...keys]
    .filter((key) => {
      const path = key.split(".");
      while (path.length > 1 && liquidMethods.has(path.at(-1))) path.pop();
      return !computed.has(path[0]) && !hasPath(schema, path);
    })
    .sort();
}

/** JSON pointers of schema properties that have no description. */
export function propertiesWithoutDescription(node = schema, at = "") {
  return Object.entries(node.properties ?? {}).flatMap(([key, child]) => [
    ...(child.description ? [] : [`${at}/${key}`]),
    ...propertiesWithoutDescription(child, `${at}/${key}`),
    ...propertiesWithoutDescription(child.items ?? {}, `${at}/${key}/items`),
    ...(child.anyOf ?? []).flatMap((alt, i) => propertiesWithoutDescription(alt, `${at}/${key}/anyOf/${i}`)),
  ]);
}
