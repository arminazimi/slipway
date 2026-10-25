// `npx create-slipway <dir>`: copies the Slipway starter into a new folder and writes its
// _config.yml. Agents pass every value as a flag; people get prompts for what is missing, and only
// when stdin is a terminal. Exit codes: 0 done, 1 bad usage, 2 the target folder is not empty.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { copyStarter, findSources, packageRoot } from "./sources.mjs";

export const modes = ["remote", "gem", "template"];
export const remoteTheme = "arminazimi/slipway";

const usage = `Usage: create-slipway <dir> [--title <title>] [--lang <code>] [--mode remote|gem|template] [--yes]

  <dir>          folder for the new site; it must be empty or not exist
  --title        site title (default: the folder name)
  --lang         language code of the site, such as en or fa (default: en)
  --mode         remote: remote_theme on GitHub Pages (default)
                 gem: theme: slipway-theme from a Gemfile
                 template: the theme files live in the site
  --yes, -y      never prompt; use the defaults for what is missing
  --help, -h     show this help
  --version, -v  show the version

Without a terminal on stdin it never prompts, as with --yes.`;

/** Folder entries that do not make a folder "not empty", so `git clone` of an empty repository works. */
const ignorable = new Set([".git"]);

export class UsageError extends Error {}

/** Parses argv into options. Throws UsageError on unknown flags or bad values. */
export function parseOptions(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        title: { type: "string" },
        lang: { type: "string" },
        mode: { type: "string" },
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
  const options = { dir: positionals[0], title: values.title, lang: values.lang, mode: values.mode, yes: Boolean(values.yes), help: Boolean(values.help), version: Boolean(values.version) };
  checkValues(options);
  return options;
}

function checkValues({ title, lang, mode }) {
  if (title !== undefined && !title.trim()) throw new UsageError("--title must not be empty");
  if (lang !== undefined && !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang)) throw new UsageError(`--lang must be a language code such as en, fa, or pt-BR, got "${lang}"`);
  if (mode !== undefined && !modes.includes(mode)) throw new UsageError(`--mode must be one of ${modes.join(", ")}, got "${mode}"`);
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
    while (!answers.dir) answers.dir = await ask("Folder for the new site");
    answers.title ??= await ask("Site title", basename(resolve(answers.dir)));
    answers.lang ??= await ask("Language code", "en");
    answers.mode ??= await ask(`Mode, one of ${modes.join(", ")}`, "remote");
    checkValues(answers);
    return answers;
  } finally {
    rl.close();
  }
}

/** The _config.yml of a new site. Titles are written as JSON strings, which YAML reads as is. */
export function siteConfig({ title, lang, mode }) {
  const lines = [`title: ${JSON.stringify(title)}`, `lang: ${lang}`];
  if (mode === "remote") lines.push(`remote_theme: ${remoteTheme}`, "plugins:", "  - jekyll-remote-theme");
  if (mode === "gem") lines.push("theme: slipway-theme");
  return `${lines.join("\n")}\n`;
}

/** The Gemfile of a new site: the GitHub Pages environment, plus the theme gem in gem mode. */
export function gemfile({ mode }) {
  const lines = ['source "https://rubygems.org"', "", "# The same Jekyll and plugins GitHub Pages runs, to preview the site locally.", 'gem "github-pages", group: :jekyll_plugins'];
  if (mode === "gem") lines.push("", "# The Slipway theme.", 'gem "slipway-theme"');
  return `${lines.join("\n")}\n`;
}

/** Whether `dir` can take a new site: missing, or holding only ignorable entries. */
export function isEmptyFolder(dir) {
  if (!existsSync(dir)) return true;
  return readdirSync(dir).every((name) => ignorable.has(name));
}

/** Creates the site. Returns the list of top-level entries written. */
export function createSite({ dir, title, lang, mode }, sources = findSources()) {
  mkdirSync(dir, { recursive: true });
  const written = copyStarter(sources, dir, { theme: mode === "template" });
  writeFileSync(join(dir, "_config.yml"), siteConfig({ title, lang, mode }));
  writeFileSync(join(dir, "Gemfile"), gemfile({ mode }));
  return [...new Set([...written, "_config.yml", "Gemfile"])].sort();
}

function nextSteps(dir, cwd) {
  const near = relative(cwd, dir);
  const shown = !near ? "." : near.startsWith("..") ? dir : near;
  const cd = /\s/.test(shown) ? JSON.stringify(shown) : shown;
  return [
    "Next:",
    `  cd ${cd} && bundle install && bundle exec jekyll serve   # build and preview`,
    "  npx slipway doctor                                       # check the site",
    '  git init && git add . && git commit -m "New Slipway site" && git push   # then turn on GitHub Pages',
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
  const site = { dir, title: options.title ?? basename(dir), lang: options.lang ?? "en", mode: options.mode ?? "remote" };
  if (!isEmptyFolder(dir)) return fail(2, `${dir} is not empty; choose a new folder or an empty one`);

  createSite(site);
  say(`Created a Slipway site in ${dir} (${site.mode} mode, lang ${site.lang}).`);
  say(nextSteps(dir, cwd));
  return 0;
}
