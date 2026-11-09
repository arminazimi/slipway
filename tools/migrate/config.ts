// Converts the text of a Slipway 0.2 `_config.yml` into the text of a `slipway.yml`, following the
// mapping table in ADR 0024 rule 5: every key either moves to its new place, with its comments, or
// is reported as dropped. The result is checked against the engine's config schema
// (packages/engine/schema/config.schema.json). The CLI that walks a site and writes files lives in
// tools/migrate/run.ts (#1184); this module is the mapping it calls. The issue's Files list named
// `.mjs` files; AGENTS.md ("TypeScript only") says to write `.ts` instead.
//
//   migrateConfig(source)     -> { yaml, dropped, errors }  (yaml is null on a parse failure)
//   migrateConfigFile(file)   -> the same, for a file on disk
//
// `dropped` lists every key with no destination, each with the reason ADR 0024 gives; `errors`
// lists parse failures and schema violations of the converted file. Comments survive on the keys
// that survive: a comment above a renamed or moved key travels with it, and comments inside a
// value that is carried over whole (a defaults `values`, a `logo`, …) are kept verbatim.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";
import { parseDocument, YAMLMap, type Document, type Pair } from "yaml";

export type MigrateProblem = { key: string | null; note: string };
export type MigrateResult = {
  /** The `slipway.yml` text, or null when the source did not parse as a mapping. */
  yaml: string | null;
  /** Keys with no destination in `slipway.yml`, each with the reason ADR 0024 gives. */
  dropped: MigrateProblem[];
  /** Parse failures and schema violations of the converted file; empty when it is valid. */
  errors: MigrateProblem[];
};

const root = fileURLToPath(new URL("../..", import.meta.url));
const configSchema = JSON.parse(readFileSync(join(root, "packages/engine/schema/config.schema.json"), "utf8"));
const validateConfig = new Ajv2020({ allErrors: true }).compile(configSchema);

/** Top-level keys that keep their value under a new (or the same) name. */
const keptKeys = new Map([
  ["title", "title"],
  ["description", "description"],
  ["url", "url"],
  ["baseurl", "base"],
  ["lang", "lang"],
  ["direction", "dir"],
  ["include", "include"],
  ["exclude", "exclude"],
]);

/** Dropped top-level keys, with the reason ADR 0024 rule 5 gives for each. */
const droppedKeys = new Map([
  ["author", "bylines and feeds leave with the blog layouts; JSON-LD names the site title as the publisher"],
  ["plugins", "Jekyll plugins; optional front matter, README indexes, redirects, the sitemap, and SEO tags are built in"],
  ["permalink", "site URLs come from the file path; a page needing another URL sets permalink, or a redirects entry covers the old one"],
  ["collections", "docs are folders; _posts and other collections leave with the blog"],
  ["future", "it published future-dated posts, and posts leave with the blog"],
  ["markdown", "the engine's Markdown is fixed (ADR 0022)"],
  ["kramdown", "the engine's Markdown and highlighting are fixed (ADR 0022)"],
  ["highlighter", "the engine's Markdown and highlighting are fixed (ADR 0022)"],
]);

/** `slipway.*` keys that move whole into `theme.options.*` (the engine knows nothing about the theme, ADR 0023). */
const slipwayToOptions = new Set(["header", "fonts", "logo", "tokens", "analytics", "persian", "arabic"]);

/** Dropped keys inside a moved `slipway.*` subtree, with the reason ADR 0024 rule 5 gives. */
const droppedSubKeys = new Map([
  ["slipway.tokens.font_display", "the display serif leaves with the editorial type system (ADR 0021)"],
  ["slipway.persian.jalali", "it dated posts only, and posts are removed"],
  ["slipway.arabic.hijri", "it dated posts only"],
]);

/** Dropped `slipway.*` groups, with the reason ADR 0024 rule 5 gives. */
const droppedSlipwayGroups = new Map([
  ["slipway.comments", "comments were on posts only; docs pages stay comment-free"],
  ["slipway.social", "it fed the links layout, which is removed; header links are the theme's to design"],
]);

/** The names that mean the theme that ships by default, so the key needs no replacement. */
const defaultThemeNames = new Set(["slipway-theme", "arminazimi/slipway"]);

const isMapNode = (node: unknown): node is YAMLMap => node instanceof YAMLMap; // a YAMLSeq also has .items, but no pairs inside
const keyOf = (pair: any) => String(pair?.key?.value ?? "");
const findPair = (node: unknown, key: string): any => (isMapNode(node) ? node.items.find((p: any) => keyOf(p) === key) : undefined);

/** A pair for `key` reusing `value`, carrying the comment that sat above the old key. */
const carriedPair = (doc: Document, key: string, value: unknown, oldPair: any): Pair<any, any> => {
  const pair = doc.createPair(key, value);
  if (oldPair?.key?.commentBefore != null) pair.key.commentBefore = oldPair.key.commentBefore;
  return pair;
};

/** The schema's complaints about a converted config, shaped like the other results. */
const schemaErrors = (value: unknown): MigrateProblem[] => {
  if (validateConfig(value)) return [];
  return (validateConfig.errors ?? []).map((error) => {
    const parts = error.instancePath.split("/").filter(Boolean);
    if (error.keyword === "additionalProperties") parts.push(error.params.additionalProperty);
    if (error.keyword === "required") parts.push(error.params.missingProperty);
    return { key: parts.join(".") || null, note: `${error.instancePath || "the config"} ${error.message}` };
  });
};

/** Moves a `slipway.*` subtree into `options`, reporting and removing the dropped keys inside it. */
const moveToOptions = (doc: Document, child: any, path: string, dropped: MigrateProblem[], options: YAMLMap) => {
  if (isMapNode(child.value)) {
    child.value.items = child.value.items.filter((pair: any) => {
      const sub = `${path}.${keyOf(pair)}`;
      if (!droppedSubKeys.has(sub)) return true;
      dropped.push({ key: sub, note: droppedSubKeys.get(sub)! });
      return false;
    });
    if (child.value.items.length === 0) {
      dropped.push({ key: path, note: `${path} has no keys left in it after the mapping` });
      return;
    }
  }
  options.items.push(child);
};

/** Rewrites one `defaults` entry from `{scope: {path, type}, values}` to `{path, values}`. */
const migrateDefaultsEntry = (doc: Document, entry: any) => {
  const scope = findPair(entry, "scope");
  const values = findPair(entry, "values");
  const path = findPair(scope?.value, "path");
  const node = doc.createNode({});
  node.items.push(doc.createPair("path", path?.value ?? doc.createNode("")));
  if (values) node.items.push(doc.createPair("values", values.value));
  // `scope.type` is dropped with the scope: there are no collections (ADR 0024 rule 5).
  if (entry.commentBefore != null) node.commentBefore = entry.commentBefore;
  if (entry.comment != null) node.comment = entry.comment;
  return node;
};

export function migrateConfig(source: string): MigrateResult {
  const doc = parseDocument(source);
  if (doc.errors.length) {
    return { yaml: null, dropped: [], errors: doc.errors.map((e) => ({ key: null, note: e.message })) };
  }
  const map = doc.contents;
  if (!isMapNode(map)) {
    return { yaml: null, dropped: [], errors: [{ key: null, note: "the config is not a mapping of keys to values" }] };
  }

  const dropped: MigrateProblem[] = [];
  const errors: MigrateProblem[] = [];
  const drop = (key: string, why?: string) => dropped.push({ key, note: why ?? "has no place in slipway.yml (ADR 0024)" });
  const out: any[] = [];
  let repository: any = null;
  let theme: any = null;

  /** The `repository` map, created at the position of the first key that needs it. */
  const ensureRepository = () => {
    if (!repository) {
      repository = doc.createPair("repository", doc.createNode({}));
      out.push(repository);
    }
    return repository.value;
  };

  /** The `theme` map, created at the position of the first key that needs it. */
  const ensureTheme = () => {
    if (!theme) {
      theme = doc.createPair("theme", doc.createNode({}));
      out.push(theme);
    }
    return theme.value;
  };

  const ensureOptions = () => {
    const themeMap = ensureTheme();
    let options = findPair(themeMap, "options");
    if (!options) {
      options = doc.createPair("options", doc.createNode({}));
      themeMap.items.push(options);
    }
    return options.value;
  };

  /** `slipway:` dissolves: its keys move to the rows ADR 0024 gives them. */
  const expandSlipway = (item: any) => {
    if (!isMapNode(item.value)) return drop("slipway", "the slipway group is not a mapping of keys to values");
    // A comment above the first key of a block map lives on the map node, which dissolves here, so
    // it is re-attached to the first key that moves.
    const leading: string | null | undefined = item.value.commentBefore;
    let first = true;
    const carry = (pair: any) => {
      if (leading != null && first) {
        pair.key.commentBefore = leading + (pair.key.commentBefore ?? "");
        first = false;
      }
    };
    for (const child of item.value.items) {
      const name = keyOf(child);
      const path = `slipway.${name}`;
      if (name === "languages" || name === "search") {
        carry(child);
        out.push(child); // the engine owns languages and search; the node moves verbatim
      } else if (name === "source_dir") {
        const repo = ensureRepository();
        const pair = carriedPair(doc, "dir", child.value, child);
        carry(pair);
        repo.items.push(pair);
      } else if (slipwayToOptions.has(name)) {
        carry(child);
        moveToOptions(doc, child, path, dropped, ensureOptions());
      } else if (droppedSlipwayGroups.has(path)) {
        drop(path, droppedSlipwayGroups.get(path));
      } else {
        drop(path, "is not a known slipway key (ADR 0024)");
      }
    }
  };

  /** `theme` / `remote_theme` name another theme, or the one that ships by default. */
  const setThemeName = (item: any, from: string) => {
    const name = item.value?.value;
    if (defaultThemeNames.has(name)) return drop(from, "names the theme that ships by default; slipway.yml needs no theme key");
    const themeMap = ensureTheme();
    if (findPair(themeMap, "name")) return drop(from, "theme.name is already set");
    themeMap.items.push(carriedPair(doc, "name", item.value, item));
  };

  for (const item of map.items as any[]) {
    const key = keyOf(item);
    if (key === "slipway") expandSlipway(item);
    else if (key === "defaults") {
      if (!Array.isArray(item.value?.items)) drop("defaults", "defaults is not a list of scope entries");
      else {
        const entries = item.value.items.map((entry: any) => migrateDefaultsEntry(doc, entry));
        item.value.items = entries;
        out.push(carriedPair(doc, "defaults", item.value, item));
      }
    } else if (key === "github") {
      const repo = ensureRepository();
      if (findPair(repo, "url")) drop("github", "repository.url is already set");
      else repo.items.push(carriedPair(doc, "url", item.value, item));
    } else if (key === "theme" || key === "remote_theme") setThemeName(item, key);
    else if (keptKeys.has(key)) {
      item.key.value = keptKeys.get(key); // the same name or a rename; the node keeps its comments
      out.push(item);
    } else if (droppedKeys.has(key)) drop(key, droppedKeys.get(key));
    else drop(key, "is not in the ADR 0024 mapping");
  }

  map.items = out as any;
  const value = doc.toJS();
  errors.push(...schemaErrors(value));
  return { yaml: doc.toString({ lineWidth: 0 }), dropped, errors };
}

export function migrateConfigFile(file: string): MigrateResult {
  return migrateConfig(readFileSync(file, "utf8"));
}
