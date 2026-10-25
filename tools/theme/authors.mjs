// Validates _data/authors.yml against schema/authors.schema.json, and checks that every `author`
// id in a site's front matter is a key of it.
//   node tools/theme/authors.mjs [site folder ...]   (every example site by default)
import Ajv2020 from "ajv/dist/2020.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { frontMatter, markdownFiles } from "./front-matter.mjs";
import { root } from "./tokens.mjs";

const schema = JSON.parse(readFileSync(join(root, "schema/authors.schema.json"), "utf8"));
const validate = new Ajv2020({ allErrors: true }).compile(schema);

export function validateAuthors(data) {
  const ok = validate(data ?? {});
  const errors = (validate.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);
  return { ok, errors };
}

/** Problems in one site: its _data/authors.yml, then each `author` id that file lacks. */
export function siteAuthorProblems(site, base = root) {
  const rel = (path) => relative(base, path).split(sep).join("/");
  const file = join(site, "_data/authors.yml");
  let authors = {};
  const problems = [];
  if (existsSync(file)) {
    authors = parse(readFileSync(file, "utf8")) ?? {};
    const { ok, errors } = validateAuthors(authors);
    if (!ok) problems.push(...errors.map((e) => `${rel(file)}: ${e}`));
  }
  for (const page of markdownFiles(site).sort()) {
    const source = frontMatter(readFileSync(page, "utf8"));
    if (source === null) continue;
    let data;
    try {
      data = parse(source) ?? {};
    } catch {
      continue; // the front matter check reports YAML errors
    }
    const ids = data.author === undefined ? [] : [data.author].flat();
    for (const id of ids) {
      if (typeof id === "string" && !Object.hasOwn(authors ?? {}, id)) problems.push(`${rel(page)}: author ${id} is not a key of _data/authors.yml`);
    }
  }
  return problems;
}

/** Problems in every examples/<name> site under `dir`. */
export function validateExampleAuthors(dir = join(root, "examples")) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => siteAuthorProblems(join(dir, entry.name)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const problems = args.length ? args.flatMap((site) => siteAuthorProblems(site, process.cwd())) : validateExampleAuthors();
  for (const problem of problems) console.error(problem);
  if (problems.length) process.exitCode = 1;
  else console.log("authors: valid");
}
