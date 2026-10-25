// Builds skills/slipway-content/reference/front-matter.md from schema/front-matter/*.schema.json.
// `node tools/skills/front-matter-reference.mjs` writes it; `--check` fails when it is stale.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectionSchemas, layoutSchemas, schemaDir } from "../theme/front-matter.mjs";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const referencePath = join(root, "skills/slipway-content/reference/front-matter.md");

const cell = (text) => String(text).replaceAll("|", "\\|").replaceAll("\n", " ");
const code = (text) => `\`${cell(text)}\``;

export const loadSchemas = () => {
  const names = [...new Set(["base", ...Object.values(layoutSchemas)])];
  return Object.fromEntries(names.map((name) => [name, JSON.parse(readFileSync(join(schemaDir, `${name}.schema.json`), "utf8"))]));
};

function resolve(schemas, node) {
  if (!node.$ref) return node;
  const [file, pointer = ""] = node.$ref.split("#");
  const owner = file ? schemas[file.replace(".schema.json", "")] : schemas.base;
  const target = pointer.split("/").filter(Boolean).reduce((at, part) => at[part], owner);
  const { $ref, ...rest } = node;
  return { ...target, ...rest };
}

function typeOf(schemas, node) {
  if (node.enum) return node.enum.map((v) => code(v)).join(" or ");
  if (node.oneOf) return node.oneOf.map((n) => typeOf(schemas, resolve(schemas, n))).join(" or ");
  if (node.type === "array") return "list";
  return node.type ?? "any";
}

function allowed(node) {
  if (node.minLength) return "not empty";
  if (node.pattern) return code(node.pattern);
  return "";
}

/** One row per key a schema adds beyond `base`, or every base key for `base` itself. */
export function listKeys(schemas, name) {
  const schema = schemas[name];
  return Object.entries(schema.properties ?? {}).map(([key, raw]) => {
    const prop = resolve(schemas, raw);
    const together = schema.dependentRequired?.[key];
    const note = together ? ` Set together with ${together.map(code).join(", ")}.` : "";
    return {
      key,
      type: typeOf(schemas, prop),
      required: (schema.required ?? []).includes(key),
      allowed: allowed(prop),
      description: (prop.description ?? "") + note,
    };
  });
}

function table(rows) {
  return [
    "| Key | Type | Required | Allowed | What it does |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((r) => `| ${code(r.key)} | ${r.type} | ${r.required ? "yes" : ""} | ${r.allowed} | ${cell(r.description)} |`),
  ].join("\n");
}

export function buildFrontMatterReference(schemas) {
  const bySchema = new Map();
  for (const [layout, name] of Object.entries(layoutSchemas)) bySchema.set(name, [...(bySchema.get(name) ?? []), layout]);
  const folders = Object.fromEntries(Object.entries(collectionSchemas).map(([folder, name]) => [name, folder]));
  const layouts = [...bySchema].map(([name, list]) =>
    `| ${list.map(code).join(", ")} | ${folders[name] ? code(`${folders[name]}/`) : ""} | ${code(`${name}.schema.json`)} | ${cell(schemas[name].description)} |`);
  const extras = [...bySchema.keys()]
    .filter((name) => listKeys(schemas, name).length)
    .map((name) => `## Only in \`${bySchema.get(name).join("`, `")}\`\n\n${table(listKeys(schemas, name))}`);
  return `<!-- Generated from schema/front-matter/*.schema.json by tools/skills/front-matter-reference.mjs. Do not edit. -->
# Front matter keys

${schemas.base.description}

## Which schema a page uses

The \`layout\` key picks the schema. A page without \`layout\` gets the schema of its collection folder, and a page outside a collection gets \`page\`. A layout not listed here gets \`base.schema.json\`.

| Layout | Folder | Schema | What it renders |
| --- | --- | --- | --- |
${layouts.join("\n")}

## Every layout

${table(listKeys(schemas, "base"))}

${extras.join("\n\n")}
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expected = buildFrontMatterReference(loadSchemas());
  if (process.argv.includes("--check")) {
    let actual = null;
    try { actual = readFileSync(referencePath, "utf8"); } catch {}
    if (actual !== expected) {
      console.error(`${referencePath} is stale; run node tools/skills/front-matter-reference.mjs`);
      process.exit(1);
    }
  } else {
    writeFileSync(referencePath, expected);
    console.log(`wrote ${referencePath}`);
  }
}
