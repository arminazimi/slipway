import { resolve, dirname, join, relative } from "node:path";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { Site } from "../site.mjs";
import { splitFrontMatter } from "../yaml.mjs";
import * as yaml from "yaml";

export const usage = `Usage: slipway translate <source-page> --to <lang> [options]

Creates a translated copy of a page in the target language's folder.

Options:
  --to <lang>          the target language code (required)
  --json               print as json instead of text
  -h, --help           show this help`;

/** Parses arguments. Returns \`{ options }\` or \`{ error }\`. */
export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "translate") return { error: command ? `unknown command: ${command}` : "missing command" };

  const options = { format: "text", to: null, source: null };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const value = () => {
      const next = rest[++i];
      if (next === undefined || next.startsWith("--")) throw new Error(`${arg} needs a value`);
      return next;
    };
    try {
      if (arg === "-h" || arg === "--help") return { help: true };
      else if (arg === "--json") options.format = "json";
      else if (arg === "--to") options.to = value();
      else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
      else if (options.source === null) options.source = arg;
      else return { error: `unexpected argument: ${arg}` };
    } catch (error) {
      return { error: error.message };
    }
  }

  if (options.source === null) return { error: "missing <source-page>" };
  if (options.to === null) return { error: "missing --to <lang>" };

  return { options };
}

/** Finds the site root by looking for _config.yml or similar files upwards. */
function findSiteRoot(startPath) {
  let current = resolve(startPath);
  if (!existsSync(current) || !existsSync(dirname(current))) {
      current = dirname(resolve(startPath));
  }

  let depth = 0;
  while (current && current !== '/' && depth < 20) {
    if (existsSync(join(current, "_config.yml")) ||
        existsSync(join(current, "slipway-theme.gemspec")) ||
        existsSync(join(current, "_layouts", "base.html"))) {
      return current;
    }
    current = dirname(current);
    depth++;
  }
  return null;
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway translate: ${parsed.error}\n\n${usage}`);
    return 2;
  }

  const { source, to, format } = parsed.options;
  const sourcePath = resolve(source);

  if (!existsSync(sourcePath)) {
    error(`slipway translate: source file does not exist: ${source}`);
    return 1;
  }

  const siteRoot = findSiteRoot(sourcePath);
  if (!siteRoot) {
    error(`slipway translate: could not find site root for ${source}`);
    return 1;
  }

  const site = new Site(siteRoot);
  const relativeSourcePath = relative(siteRoot, sourcePath).split("\\").join("/");

  const fm = site.frontMatterOf(relativeSourcePath);

  if (!fm || !fm.data) {
    error(`slipway translate: source page must have front matter`);
    return 1;
  }

  if (fm.error) {
    error(`slipway translate: ${fm.error}`);
    return 1;
  }

  const translationKey = fm.data.translation_key;
  if (!translationKey) {
    error(`slipway translate: source page is missing translation_key in front matter`);
    return 1;
  }

  const configRes = site.dataOf("_config.yml");
  let prefix = `/${to}`;

  if (configRes && !configRes.error && configRes.data && configRes.data.slipway && configRes.data.slipway.languages) {
    const langConfig = configRes.data.slipway.languages.find(l => l.code === to);
    if (langConfig && langConfig.prefix !== undefined) {
      prefix = langConfig.prefix;
    }
  }

  const cleanPrefix = prefix.startsWith("/") ? prefix.slice(1) : prefix;

  let targetRelative = relativeSourcePath;
  if (configRes && !configRes.error && configRes.data && configRes.data.slipway && configRes.data.slipway.languages) {
      const sourceLangCode = fm.data.lang || "en";
      const sourceLangConfig = configRes.data.slipway.languages.find(l => l.code === sourceLangCode);
      if (sourceLangConfig && sourceLangConfig.prefix) {
          const srcPrefix = sourceLangConfig.prefix.startsWith("/") ? sourceLangConfig.prefix.slice(1) : sourceLangConfig.prefix;
          if (srcPrefix && targetRelative.startsWith(srcPrefix + "/")) {
              targetRelative = targetRelative.slice(srcPrefix.length + 1);
          }
      }
  }

  const targetPathRelative = cleanPrefix ? join(cleanPrefix, targetRelative).replace(/\\/g, '/') : targetRelative;
  const targetPath = join(siteRoot, targetPathRelative);

  if (existsSync(targetPath)) {
    error(`slipway translate: target file already exists: ${targetPathRelative}`);
    return 1;
  }

  const sourceContent = readFileSync(sourcePath, "utf8");
  const block = splitFrontMatter(sourceContent);
  let body = sourceContent;
  if (block) {
    const lines = sourceContent.split(/\r?\n/);
    body = lines.slice(block.offset + block.text.split(/\r?\n/).length + 1).join("\n");
  }

  const newFmData = { ...fm.data, lang: to };

  const yamlString = Object.keys(newFmData).length > 0 ? `---\n${yaml.stringify(newFmData)}---\n` : "";
  const newContent = `${yamlString}${body}`;

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, newContent, "utf8");

  if (format === "json") {
    log(JSON.stringify({
      source: relativeSourcePath,
      target: targetPathRelative,
      lang: to,
      translation_key: translationKey
    }, null, 2));
  } else {
    log(`Translated ${relativeSourcePath} to ${targetPathRelative} for language ${to}`);
  }

  return 0;
}
