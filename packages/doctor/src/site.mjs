// What the checks read from a site, loaded once: source files, AGENTS.md, the schema index, its schemas, and the source map.
import Ajv2020 from "ajv/dist/2020.js";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { matchesAny } from "./glob.mjs";
import { parseWithLines, splitFrontMatter } from "./yaml.mjs";

const packaged = (name) => JSON.parse(readFileSync(fileURLToPath(new URL(`../schema/${name}`, import.meta.url)), "utf8"));
const metaAjv = new Ajv2020({ allErrors: true, verbose: true, strict: false });
export const validateIndex = metaAjv.compile(packaged("content-schemas.schema.json"));
export const validateSourcemap = metaAjv.compile(packaged("sourcemap.schema.json"));

/** Folders never walked: version control and dependencies. Other dot-folders are skipped too, except `.well-known`. */
const skipped = new Set([".git", "node_modules"]);

const once = (target, key, load) => {
  const cache = (target.cache ??= new Map());
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key);
};

export class Site {
  constructor(source, { build = null, network = false } = {}) {
    this.source = resolve(source);
    this.build = build ? resolve(build) : null;
    this.network = network;
  }

  /** A path inside `base` for a forward-slash relative path, or null when it would leave `base`. */
  inside(base, path) {
    const full = resolve(base, ...path.split("/"));
    const rel = relative(base, full);
    return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel)) ? full : null;
  }

  isFile(base, path) {
    const full = this.inside(base, path);
    return Boolean(full && existsSync(full) && statSync(full).isFile());
  }

  /** The output folder as AGENTS.md would name it: its path from the source folder, or its name when it is elsewhere. */
  outputNames() {
    if (!this.build) return [];
    const rel = relative(this.source, this.build).split(sep).join("/");
    return rel && !rel.startsWith("..") && !isAbsolute(rel) ? [rel] : [basename(this.build)];
  }

  /** Every file in the source folder, as forward-slash paths, without the output folder. */
  files() {
    return once(this, "files", () => {
      const result = [];
      const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) {
            if (skipped.has(entry.name) || (entry.name.startsWith(".") && entry.name !== ".well-known")) continue;
            if (this.build && full === this.build) continue;
            walk(full);
          } else if (entry.isFile()) result.push(relative(this.source, full).split(sep).join("/"));
        }
      };
      walk(this.source);
      return result.sort();
    });
  }

  read(path) {
    return once(this, `read:${path}`, () => readFileSync(join(this.source, ...path.split("/")), "utf8"));
  }

  /** A file's front matter: `{ data, lineOf, offset }`, `{ error, line }`, `{ unsupported }`, or null when it has none. */
  frontMatterOf(path) {
    return once(this, `fm:${path}`, () => {
      const block = splitFrontMatter(this.read(path));
      if (!block) return null;
      if (block.format === "toml") return { unsupported: "TOML front matter" };
      if (block.format === "json") {
        try {
          return { data: JSON.parse(block.text), lineOf: () => 1, offset: 0 };
        } catch (error) {
          return { error: `JSON does not parse: ${error.message}`, line: 1 };
        }
      }
      const parsed = parseWithLines(block.text);
      if (parsed.error) return { error: `YAML does not parse: ${parsed.error}`, line: parsed.errorLine + block.offset };
      return { data: parsed.data, lineOf: parsed.lineOf, offset: block.offset };
    });
  }

  /** A whole data file parsed by its extension, like frontMatterOf. */
  dataOf(path) {
    return once(this, `data:${path}`, () => {
      const text = this.read(path);
      if (/\.ya?ml$/i.test(path)) {
        const parsed = parseWithLines(text);
        if (parsed.error) return { error: `YAML does not parse: ${parsed.error}`, line: parsed.errorLine };
        return { data: parsed.data, lineOf: parsed.lineOf, offset: 0 };
      }
      if (/\.json$/i.test(path)) {
        try {
          return { data: JSON.parse(text), lineOf: () => 1, offset: 0 };
        } catch (error) {
          return { error: `JSON does not parse: ${error.message}`, line: 1 };
        }
      }
      return { unsupported: `${path.split(".").pop().toUpperCase()} files` };
    });
  }

  /** AGENTS.md: `{ text, size }`, `{ error }` when it is not UTF-8, or null when it is missing. */
  agents() {
    return once(this, "agents", () => {
      const path = join(this.source, "AGENTS.md");
      if (!existsSync(path) || !statSync(path).isFile()) return null;
      const bytes = readFileSync(path);
      try {
        return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, ""), size: bytes.length };
      } catch {
        return { error: "is not valid UTF-8", size: bytes.length };
      }
    });
  }

  /** content-schemas.json: `{ data }` when valid, `{ errors }` when not, or null when missing. */
  index() {
    return once(this, "index", () => {
      if (!this.isFile(this.source, "content-schemas.json")) return null;
      let data;
      try {
        data = JSON.parse(this.read("content-schemas.json"));
      } catch (error) {
        return { errors: [{ key: "/", message: `JSON does not parse: ${error.message}` }] };
      }
      if (validateIndex(data)) return { data };
      return {
        errors: validateIndex.errors.map((error) => ({ key: error.instancePath || "/", message: error.message })),
      };
    });
  }

  entries(target) {
    return (this.index()?.data?.schemas ?? []).filter((entry) => entry.target === target);
  }

  /** Whether a front-matter entry applies to a file: its globs match and its `when` values equal the file's. */
  applies(entry, path) {
    if (!matchesAny(path, entry.files)) return false;
    if (entry.target === "file") return true;
    const fm = this.frontMatterOf(path);
    if (!fm?.data) return false;
    return Object.entries(entry.when ?? {}).every(([key, value]) => fm.data?.[key] === value);
  }

  /**
   * Every schema the index names, compiled: a Map from the `schema` string to
   * `{ validate, schema }`, `{ error }`, or `{ notRun }` (an https URL with the network off).
   */
  async schemas() {
    if (this.cache?.has("schemas")) return this.cache.get("schemas");
    const result = new Map();
    const ajv = new Ajv2020({ allErrors: true, verbose: true, strict: false, validateFormats: false, loadSchema: (uri) => this.loadSchema(uri) });
    this.idDirs = [];
    for (const ref of new Set((this.index()?.data?.schemas ?? []).map((entry) => entry.schema))) {
      try {
        const schema = await this.loadSchema(ref.startsWith("https://") ? ref : pathToFileURL(join(this.source, ...ref.split("/"))).href);
        // A schema another one already loaded through `$ref` is compiled once.
        const validate = (typeof schema.$id === "string" && ajv.getSchema(schema.$id)) || (await ajv.compileAsync(schema));
        result.set(ref, { schema, validate });
      } catch (error) {
        result.set(ref, error.notRun ? { notRun: error.message } : { error: error.message });
      }
    }
    (this.cache ??= new Map()).set("schemas", result);
    return result;
  }

  /** Loads a schema by URI: a file inside the source folder, an https URL whose `$id` folder maps to a local folder, or the network when allowed. */
  async loadSchema(uri) {
    if (uri.startsWith("file:")) {
      const path = fileURLToPath(uri);
      const rel = relative(this.source, path).split(sep).join("/");
      if (!this.inside(this.source, rel) || rel === "") throw new Error(`${uri} is outside the source folder`);
      if (!this.isFile(this.source, rel)) throw new Error(`${rel} does not exist`);
      let schema;
      try {
        schema = JSON.parse(this.read(rel));
      } catch (error) {
        throw new Error(`${rel} does not parse as JSON: ${error.message}`);
      }
      if (typeof schema.$id === "string" && schema.$id.startsWith("https://")) {
        this.idDirs.push({ id: schema.$id.slice(0, schema.$id.lastIndexOf("/") + 1), dir: dirname(path) });
      } else if (typeof schema === "object" && schema && !schema.$id) {
        schema = { ...schema, $id: uri };
      }
      return schema;
    }
    if (uri.startsWith("https://")) {
      for (const { id, dir } of this.idDirs) {
        if (!uri.startsWith(id)) continue;
        const local = pathToFileURL(join(dir, ...uri.slice(id.length).split("#")[0].split("/"))).href;
        if (existsSync(fileURLToPath(local))) return this.loadSchema(local);
      }
      if (!this.network) throw Object.assign(new Error(`${uri} needs the network (--network)`), { notRun: true });
      const response = await fetch(uri);
      if (!response.ok) throw new Error(`${uri} answered ${response.status}`);
      return response.json();
    }
    throw new Error(`${uri} is neither a relative path nor an https URL`);
  }

  /** /sourcemap.json from the output folder: `{ data }`, `{ errors }`, or null when missing or no output folder. */
  sourcemap() {
    return once(this, "sourcemap", () => {
      if (!this.build || !this.isFile(this.build, "sourcemap.json")) return null;
      let data;
      try {
        data = JSON.parse(readFileSync(join(this.build, "sourcemap.json"), "utf8"));
      } catch (error) {
        return { errors: [{ key: "/", message: `JSON does not parse: ${error.message}` }] };
      }
      const errors = validateSourcemap(data)
        ? []
        : validateSourcemap.errors.map((error) => ({ key: error.instancePath || "/", message: error.message }));
      return errors.length ? { data, errors } : { data };
    });
  }

  /** The output file for a site URL path: `/a/` is `/a/index.html`. Null when it is not a file in the output folder. */
  outputFile(url) {
    let path = url.split(/[?#]/)[0];
    try {
      path = decodeURIComponent(path);
    } catch {
      return null;
    }
    if (path.endsWith("/")) path += "index.html";
    path = path.replace(/^\/+/, "");
    return this.isFile(this.build, path) ? path : null;
  }

  readOutput(path) {
    return once(this, `out:${path}`, () => readFileSync(join(this.build, ...path.split("/")), "utf8"));
  }

  /** Every .html file in the output folder. */
  outputHtml() {
    return once(this, "outputHtml", () => {
      const result = [];
      const walk = (dir) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (entry.isFile() && /\.html?$/i.test(entry.name)) result.push(relative(this.build, full).split(sep).join("/"));
        }
      };
      walk(this.build);
      return result.sort();
    });
  }
}
