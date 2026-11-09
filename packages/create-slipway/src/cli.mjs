// `npx create-slipway <dir>`: writes a docs site that builds with the engine and deploys with the
// deploy Action. Agents pass every value as a flag; people get prompts for what is missing, and only
// when stdin is a terminal. Exit codes: 0 done, 1 bad usage, 2 the target folder is not empty.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { findSources, packageRoot, writeTemplate } from "./sources.mjs";

const usage = `Usage: create-slipway <dir> [--title <title>] [--repository <owner/name>] [--lang <code>] [--yes]

  <dir>          folder for the new site; it must be empty or not exist
  --title        site title (default: the folder name)
  --repository   GitHub repository as owner/name or an https URL, for "Edit this page" links
  --lang         language code of the site, such as en or fa (default: en)
  --yes, -y      never prompt; use the defaults for what is missing
  --help, -h     show this help
  --version, -v  show the version

Without a terminal on stdin it never prompts, as with --yes.`;

/** Folder entries that do not make a folder "not empty", so `git clone` of an empty repository works. */
const ignorable = new Set([".git"]);

export class UsageError extends Error {}

/** Reads `owner/name` or an https URL, and normalizes it to the repository's web URL. */
export function parseRepository(value) {
  const text = value.trim();
  const shorthand = /^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/.exec(text);
  if (shorthand) return repositoryAt(`https://github.com/${shorthand[1]}/${shorthand[2]}`, shorthand[1], shorthand[2]);

  let url;
  try {
    url = new URL(text);
  } catch {
    throw new UsageError(`--repository must be owner/name or an https URL, got "${value}"`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new UsageError(`--repository must be an https URL, got "${value}"`);
  }
  const parts = url.pathname.replace(/\/+$/, "").replace(/\.git$/, "").split("/").filter(Boolean);
  if (parts.length !== 2) throw new UsageError(`--repository must name one repository as owner/name, got "${value}"`);
  return repositoryAt(`${url.origin}/${parts[0]}/${parts[1]}`, parts[0], parts[1]);
}

function repositoryAt(url, owner, name) {
  return { url, owner, name };
}

/** Parses argv into options. Throws UsageError on unknown flags or bad values. */
export function parseOptions(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        title: { type: "string" },
        repository: { type: "string" },
        lang: { type: "string" },
        yes: { type: "boolean", short: "y" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    });
  } catch (error) {
    throw new UsageError(error.message);
  }
  const { values, positionals } = parsed;
  if (positionals.length > 1) throw new UsageError(`expected one folder, got ${positionals.length}: ${positionals.join(" ")}`);
  const options = { dir: positionals[0], title: values.title, lang: values.lang, repository: values.repository, yes: Boolean(values.yes), help: Boolean(values.help), version: Boolean(values.version) };
  checkValues(options);
  return options;
}

function checkValues({ title, lang, repository }) {
  if (title !== undefined && !title.trim()) throw new UsageError("--title must not be empty");
  if (lang !== undefined && !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang)) throw new UsageError(`--lang must be a language code such as en, fa, or pt-BR, got "${lang}"`);
  if (repository !== undefined) parseRepository(repository);
}

/** Asks for each value that is still missing. Empty answers take the default. */
async function prompt(options, input, output) {
  // Lines are read through the iterator, not rl.question(), so answers typed or piped ahead of a
  // question are kept instead of dropped.
  const rl = createInterface({ input, terminal: false });
  const lines = rl[Symbol.asyncIterator]();
  try {
    const ask = async (question, fallback) => {
      output.write(fallback ? `${question} (${fallback}): ` : `${question}: `);
      const { value, done } = await lines.next();
      if (done && !fallback) throw new UsageError(`no answer for "${question}"`);
      return (done ? "" : value.trim()) || fallback;
    };
    const answers = { ...options };
    while (!answers.dir) answers.dir = await ask("Folder for the new site", "");
    answers.title ??= await ask("Site title", basename(resolve(answers.dir)));
    answers.repository ??= await ask("Repository, owner/name (empty to skip)", "");
    answers.lang ??= await ask("Language code", "en");
    if (answers.repository === "") answers.repository = undefined;
    else checkValues(answers);
    return answers;
  } finally {
    rl.close();
  }
}

/** The `mizzen.yml` of a new site. Titles and URLs are written as JSON strings, which YAML reads as is. */
export function siteConfig({ title, lang, repository }) {
  const lines = [`title: ${JSON.stringify(title)}`, `lang: ${lang}`, "source: docs"];
  if (repository !== undefined) {
    const host = new URL(repository.url).hostname;
    if (host === "github.com") {
      const owner = repository.owner.toLowerCase();
      lines.push(`url: ${JSON.stringify(`https://${owner}.github.io`)}`);
      const base = repository.name.toLowerCase() === `${owner}.github.io` ? "" : `/${repository.name}`;
      lines.push(`base: ${JSON.stringify(base)}`);
    }
  }
  lines.push("defaults:", '  - path: ""', "    values:", "      layout: doc");
  if (repository !== undefined) lines.push("repository:", `  url: ${JSON.stringify(repository.url)}`);
  return `${lines.join("\n")}\n`;
}

/** Whether `dir` can take a new site: missing, or holding only ignorable entries. */
export function isEmptyFolder(dir) {
  if (!existsSync(dir)) return true;
  return readdirSync(dir).every((name) => ignorable.has(name));
}

/** Creates the site. Returns the list of entries written, relative to `dir`. */
export function createSite({ dir, title, lang, repository }, sources = findSources()) {
  mkdirSync(dir, { recursive: true });
  const written = writeTemplate(dir, sources);
  writeFileSync(join(dir, "mizzen.yml"), siteConfig({ title, lang, repository }));
  writeFileSync(join(dir, "content-schemas.json"), readFileSync(join(packageRoot, "src/content-schemas.json")));
  return [...written, "mizzen.yml", "content-schemas.json"].sort();
}

function nextSteps({ dir, cwd, repository }) {
  const near = relative(cwd, dir);
  const shown = !near ? "." : near.startsWith("..") ? dir : near;
  const cd = /\s/.test(shown) ? JSON.stringify(shown) : shown;
  const remote = repository === undefined ? "origin <your-repository-url>" : `origin ${repository.url}`;
  return [
    "Next:",
    `  cd ${cd}`,
    "  npx @velella/mizzen build . --out dist   # preview the site",
    '  git init && git add . && git commit -m "New docs site"',
    `  git remote add ${remote} && git push -u origin main`,
    ...(repository === undefined ? ["  # set base in mizzen.yml to /<repository> for a project site"] : []),
    "  # then set Settings -> Pages -> Source to GitHub Actions",
  ].join("\n");
}

/** Runs the CLI. Returns the exit code. */
export async function main(argv, { stdin = process.stdin, stdout = process.stdout, stderr = process.stderr, cwd = process.cwd() } = {}) {
  const say = (text) => stdout.write(`${text}\n`);
  const fail = (code, text) => {
    stderr.write(`create-slipway: ${text}\n`);
    return code;
  };
  let options;
  try {
    options = parseOptions(argv);
  } catch (error) {
    if (error instanceof UsageError) return fail(1, `${error.message}\n\n${usage}`);
    throw error;
  }
  if (options.help) return say(usage), 0;
  if (options.version) return say(JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")).version), 0;

  const interactive = !options.yes && Boolean(stdin.isTTY);
  if (interactive) {
    try {
      options = await prompt(options, stdin, stdout);
    } catch (error) {
      if (error instanceof UsageError) return fail(1, error.message);
      throw error;
    }
  } else if (!options.dir) return fail(1, `name a folder for the new site\n\n${usage}`);

  const dir = resolve(cwd, options.dir);
  const site = {
    dir,
    title: options.title ?? basename(dir),
    lang: options.lang ?? "en",
    repository: options.repository === undefined ? undefined : parseRepository(options.repository),
  };
  if (!isEmptyFolder(dir)) return fail(2, `${dir} is not empty; choose a new folder or an empty one`);

  createSite(site);
  say(`Created a docs site in ${dir}.`);
  say(nextSteps({ dir, cwd, repository: site.repository }));
  return 0;
}
