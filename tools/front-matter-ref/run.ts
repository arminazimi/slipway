// Builds site/front-matter.md from packages/engine/schema/front-matter.schema.json (ADR 0024, rule 3).
//   node tools/front-matter-ref/run.ts           fail when the page is stale (the check `npm run check` runs)
//   node tools/front-matter-ref/run.ts --write   rewrite the page
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
export const schemaPath = join(root, "packages/engine/schema/front-matter.schema.json");
export const referencePath = join(root, "site/front-matter.md");

/** JSON Schema, as far as this tool reads it. */
export interface SchemaNode {
  readonly type?: string;
  readonly enum?: readonly (string | number | boolean)[];
  readonly anyOf?: readonly SchemaNode[];
  readonly items?: SchemaNode;
  readonly properties?: Readonly<Record<string, SchemaNode>>;
  readonly minLength?: number;
  readonly pattern?: string;
  readonly description?: string;
}

export interface Schema extends SchemaNode {
  readonly description: string;
  readonly properties: Readonly<Record<string, SchemaNode>>;
}

const cell = (text: string) => text.replaceAll("|", "\\|").replaceAll("\n", " ");
const code = (text: string) => `\`${cell(text)}\``;

/** A markdown list of the given values, joined with `or`. */
const list = (values: readonly string[]) => values.map(code).join(" or ");

export function typeOf(node: SchemaNode): string {
  if (node.enum) return list(node.enum.map((value) => String(value)));
  if (node.anyOf) return node.anyOf.map(typeOf).join(" or ");
  if (node.type === "array") {
    const item = node.items === undefined ? "any" : typeOf(node.items);
    return `list of ${item === "string" ? "strings" : item}`;
  }
  return node.type ?? "any";
}

export function allowed(node: SchemaNode): string {
  if (node.minLength !== undefined) return "not empty";
  if (node.pattern) return code(node.pattern);
  const keys = Object.keys(node.properties ?? {});
  return keys.length === 0 ? "" : `keys ${keys.map(code).join(", ")}`;
}

export interface KeyRow {
  readonly key: string;
  readonly type: string;
  readonly allowed: string;
  readonly description: string;
}

/** One row per key, in the schema's order (alphabetical, like every schema property). */
export function listKeys(schema: Schema): readonly KeyRow[] {
  return Object.entries(schema.properties).map(([key, node]) => ({
    key,
    type: typeOf(node),
    allowed: allowed(node),
    description: node.description ?? "",
  }));
}

export function buildFrontMatterRef(schema: Schema): string {
  const rows = listKeys(schema).map((row) => `| ${code(row.key)} | ${row.type} | ${row.allowed} | ${cell(row.description)} |`);
  return `---
title: Front matter
description: The front matter keys the Slipway engine reads.
layout: doc
permalink: /front-matter/
date: 2026-11-09
author: Slipway
---
<!-- Generated from packages/engine/schema/front-matter.schema.json by tools/front-matter-ref/run.ts. Do not edit below this line. -->

${schema.description}

Front matter is a YAML block between two \`---\` lines at the top of a \`.md\` or \`.html\` file. A page without front matter still builds: its title is its first \`h1\`, its URL comes from its file path, and its layout comes from \`defaults\` in \`slipway.yml\` or from the theme.

## Keys the engine reads

| Key | Type | Allowed | What the engine does with it |
| --- | --- | --- | --- |
${rows.join("\n")}

## Folder defaults

\`defaults\` in \`slipway.yml\` sets front matter for every page under a folder, such as \`layout\` for all of \`docs/\`. A key in a page's own front matter always wins over \`defaults\`.
`;
}

export const loadSchema = (): Schema => JSON.parse(readFileSync(schemaPath, "utf8")) as Schema;

/** Checks the committed page, or with `--write` regenerates it; returns the process exit code. */
export function main(args: readonly string[] = process.argv.slice(2)): number {
  const expected = buildFrontMatterRef(loadSchema());
  if (args.includes("--write")) {
    writeFileSync(referencePath, expected);
    console.log(`wrote ${relative(root, referencePath)}`);
    return 0;
  }
  let actual = null;
  try {
    actual = readFileSync(referencePath, "utf8");
  } catch {}
  if (actual !== expected) {
    console.error(`${relative(root, referencePath)} is stale; run node tools/front-matter-ref/run.ts --write`);
    return 1;
  }
  console.log(`front-matter-ref: ${relative(root, referencePath)} matches the engine schema`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main();
