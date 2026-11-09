// Builds site/config.md from the engine's config schema (packages/engine/schema/config.schema.json).
// `node tools/config-ref/run.ts --write` writes it; without a flag it fails when the page is stale.
// `npm run check` runs it, so a stale page fails the gate.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const schemaPath = join(root, "packages/engine/schema/config.schema.json");
export const referencePath = join(root, "site/config.md");

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
  if ("const" in node) return code(JSON.stringify(node.const));
  if (node.oneOf) return node.oneOf.map((n) => typeOf(schema, resolve(schema, n))).join(" or ");
  if (node.anyOf && !node.type) return node.anyOf.map((n) => typeOf(schema, resolve(schema, n))).join(" or ");
  if (node.type === "array") return `list of ${typeOf(schema, resolve(schema, node.items))}`;
  return node.type ?? "any";
}

/** The object branch of a node that is an object or a choice between values and an object. */
function objectOf(schema, node) {
  if (node.type === "object" && node.properties) return node;
  return (node.oneOf ?? []).map((n) => resolve(schema, n)).find((n) => n.type === "object" && n.properties);
}

/** One row per key, depth first; list items are written `key[].field`. */
export function listKeys(schema, node = schema, prefix = "") {
  const rows = [];
  for (const [name, raw] of Object.entries<any>(node.properties ?? {})) {
    const prop = resolve(schema, raw);
    const key = prefix + name;
    const required = (node.required ?? []).includes(name);
    const type = raw.$ref ? `${prop.type}: ${schema.$defs[raw.$ref.replace("#/$defs/", "")].description}` : typeOf(schema, prop);
    rows.push({ key, type, default: prop.default, required, description: prop.description ?? "" });
    const object = objectOf(schema, prop);
    if (object) rows.push(...listKeys(schema, object, `${key}.`));
    if (prop.type === "array" && prop.items) {
      const item = resolve(schema, prop.items);
      if (item.properties) rows.push(...listKeys(schema, item, `${key}[].`));
    }
  }
  return rows;
}

export function buildConfigDoc(schema) {
  const rows = listKeys(schema).map((r) => {
    const value = r.default === undefined ? (r.required ? "required" : "") : code(typeof r.default === "string" ? r.default : JSON.stringify(r.default));
    return `| ${code(r.key)} | ${r.type} | ${value} | ${cell(r.description)} |`;
  });
  return `---
title: Configuration
description: Slipway configuration reference.
layout: doc
permalink: /config/
date: 2026-10-26
author: Slipway
---
<!-- Generated from packages/engine/schema/config.schema.json by tools/config-ref/run.ts. Do not edit below this line. -->

${schema.description}

| Key | Type | Default | What it does |
| --- | --- | --- | --- |
${rows.join("\n")}
`;
}

export const loadSchema = () => JSON.parse(readFileSync(schemaPath, "utf8"));

export function main(args = process.argv.slice(2)): number {
  const expected = buildConfigDoc(loadSchema());
  if (args.includes("--write")) {
    writeFileSync(referencePath, expected);
    console.log(`wrote ${referencePath}`);
    return 0;
  }
  let actual = null;
  try { actual = readFileSync(referencePath, "utf8"); } catch {}
  if (actual !== expected) {
    console.error(`${referencePath} is stale; run node tools/config-ref/run.ts --write`);
    return 1;
  }
  console.log("OK config-ref: site/config.md matches the engine config schema");
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exitCode = main();
