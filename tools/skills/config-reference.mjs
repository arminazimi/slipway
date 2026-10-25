// Builds skills/slipway-site/reference/config.md from schema/slipway-config.schema.json.
// `node tools/skills/config-reference.mjs` writes it; `--check` fails when it is stale.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const schemaPath = join(root, "schema/slipway-config.schema.json");
export const referencePath = join(root, "skills/slipway-site/reference/config.md");

const cell = (text) => String(text).replaceAll("|", "\\|").replaceAll("\n", " ");
const code = (text) => `\`${cell(text)}\``;

function resolve(schema, node) {
  if (!node.$ref) return node;
  const target = node.$ref.replace("#/$defs/", "");
  const { $ref, ...rest } = node;
  return { ...schema.$defs[target], ...rest };
}

function typeOf(schema, node) {
  if (node.enum) return node.enum.map((v) => code(v)).join(" or ");
  if (node.anyOf && !node.type) return node.anyOf.map((n) => typeOf(schema, resolve(schema, n))).join(" or ");
  if (node.type === "array") return `list of ${typeOf(schema, resolve(schema, node.items))}`;
  return node.type ?? "any";
}

/** One row per key, depth first; list items are written `key[].field`. */
export function listKeys(schema, node = schema, prefix = "") {
  const rows = [];
  for (const [name, raw] of Object.entries(node.properties ?? {})) {
    const prop = resolve(schema, raw);
    const key = prefix + name;
    const required = (node.required ?? []).includes(name);
    const type = raw.$ref ? `${prop.type}: ${schema.$defs[raw.$ref.replace("#/$defs/", "")].description}` : typeOf(schema, prop);
    rows.push({ key, type, default: prop.default, required, description: prop.description ?? "" });
    if (prop.type === "object" && prop.properties) rows.push(...listKeys(schema, prop, `${key}.`));
    if (prop.type === "array" && prop.items) {
      const item = resolve(schema, prop.items);
      if (item.properties) rows.push(...listKeys(schema, item, `${key}[].`));
    }
  }
  return rows;
}

export function buildConfigReference(schema) {
  const rows = listKeys(schema).map((r) => {
    const value = r.default === undefined ? (r.required ? "required" : "") : code(typeof r.default === "string" ? r.default : JSON.stringify(r.default));
    return `| ${code(r.key)} | ${r.type} | ${value} | ${cell(r.description)} |`;
  });
  return `<!-- Generated from schema/slipway-config.schema.json by tools/skills/config-reference.mjs. Do not edit. -->
# _config.yml keys

${schema.description}

| Key | Type | Default | What it does |
| --- | --- | --- | --- |
${rows.join("\n")}
`;
}

export const loadSchema = () => JSON.parse(readFileSync(schemaPath, "utf8"));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expected = buildConfigReference(loadSchema());
  if (process.argv.includes("--check")) {
    let actual = null;
    try { actual = readFileSync(referencePath, "utf8"); } catch {}
    if (actual !== expected) {
      console.error(`${referencePath} is stale; run node tools/skills/config-reference.mjs`);
      process.exit(1);
    }
  } else {
    writeFileSync(referencePath, expected);
    console.log(`wrote ${referencePath}`);
  }
}
