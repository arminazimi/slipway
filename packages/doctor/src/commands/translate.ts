import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { Site } from "../site.ts";
import { splitFrontMatter } from "../yaml.ts";
import * as yaml from "yaml";

/** Files that mark a site root: the engine's config first (ADR 0025), then Jekyll's. */
const configFiles = ["mizzen.yml", "mizzen.yaml", "slipway.yml", "slipway.yaml", "_config.yml"];

export const usage = `Usage: slipway translate <source-page> --to <lang> [options]

Creates a translated copy of a page in the target language's folder.

On an engine site the language comes from the page's lang front matter, the
language prefix its path sits under, or the site's lang. The copy goes under
the target language's configured prefix, and a permalink moves with it.

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

/** Finds the site root by looking for an engine config, Jekyll's config, or a theme folder upwards. */
function findSiteRoot(startPath) {
  let current = resolve(startPath);
  if (!existsSync(current) || !existsSync(dirname(current))) {
      current = dirname(resolve(startPath));
  }

  let depth = 0;
  while (current && current !== '/' && depth < 20) {
    if (configFiles.some((file) => existsSync(join(current, file))) ||
        existsSync(join(current, "slipway-theme.gemspec")) ||
        existsSync(join(current, "_layouts", "base.html"))) {
      return current;
    }
    current = dirname(current);
    depth++;
  }
  return null;
}

/** A path as forward-slash segments: `./fa/about.md` → `["fa", "about.md"]`. */
function pathSegments(path) {
  return path
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "")
    .split("/")
    .filter((segment) => segment.length > 0);
}

/** The URL folder of a language prefix, such as `/fa` → `fa`; `""` (the default language) → `""`. */
function prefixFolder(prefix) {
  return pathSegments(typeof prefix === "string" ? prefix : "").join("/");
}

/** The language whose URL prefix the path sits under, or undefined when none matches. */
function languageFromPrefix(path, languages) {
  const segments = pathSegments(path);
  for (const language of languages) {
    const prefix = pathSegments(prefixFolder(language.prefix));
    if (prefix.length > 0 && prefix.every((part, index) => segments[index] === part)) return language;
  }
  return undefined;
}

/** The body of a page, after its front matter block. */
function bodyAfterFrontMatter(sourceContent) {
  const block = splitFrontMatter(sourceContent);
  if (!block) return sourceContent;
  const lines = sourceContent.split(/\r?\n/);
  return lines.slice(block.offset + block.text.split(/\r?\n/).length + 1).join("\n");
}

/** The page path with a language prefix removed from its front. */
function withoutPrefix(path, prefix) {
  const folder = prefixFolder(prefix);
  if (!folder) return path;
  const segments = pathSegments(path);
  const parts = pathSegments(folder);
  if (parts.every((part, index) => segments[index] === part)) return segments.slice(parts.length).join("/");
  return path;
}

/** The page path under a language prefix. */
function withPrefix(path, prefix) {
  const folder = prefixFolder(prefix);
  return folder ? `${folder}/${path}`.replace(/^\/+/, "") : path;
}

/** A permalink moved from one language prefix to another, keeping its shape. */
function translatedPermalink(permalink, fromPrefix, toPrefix) {
  if (typeof permalink !== "string" || !permalink.startsWith("/")) return permalink;
  const trailing = permalink.endsWith("/") ? "/" : "";
  const moved = withPrefix(withoutPrefix(permalink.slice(1), fromPrefix), toPrefix);
  return `/${moved}${trailing && !moved.endsWith("/") ? trailing : ""}`;
}

/** Translates a page on an engine site by the engine's language rules. Returns the exit code. */
function translateEngineSite(siteRoot, sourcePath, to, format, { log, error }, site, config) {
  if (config.error) {
    error(`slipway translate: ${config.file} does not parse: ${config.error}`);
    return 1;
  }

  const sourceFolder = typeof config.data?.source === "string" && config.data.source.trim() !== "" ? config.data.source.trim() : ".";
  const contentRoot = resolve(siteRoot, sourceFolder);
  const relativeSourcePath = relative(contentRoot, sourcePath);
  if (relativeSourcePath.startsWith("..") || isAbsolute(relativeSourcePath)) {
    error(`slipway translate: source page is outside the site's source folder: ${sourceFolder}`);
    return 1;
  }

  const siteRelativeSource = relative(siteRoot, sourcePath).split("\\").join("/");
  const pagePath = relativeSourcePath.split("\\").join("/");
  const fm = site.frontMatterOf(siteRelativeSource);

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

  const languages = Array.isArray(config.data?.languages) ? config.data.languages : [];
  const targetLanguage = languages.find((language) => language?.code === to);
  if (!targetLanguage) {
    error(`slipway translate: ${to} is not in languages in ${config.file}`);
    return 1;
  }

  const frontMatterLang = typeof fm.data.lang === "string" ? fm.data.lang.trim() : "";
  const sourceLanguage = frontMatterLang
    ? languages.find((language) => language?.code === frontMatterLang)
    : languageFromPrefix(pagePath, languages);
  const sourcePrefix = sourceLanguage?.prefix ?? "";
  const targetRelative = withPrefix(withoutPrefix(pagePath, sourcePrefix), targetLanguage.prefix);
  const targetPath = join(contentRoot, ...targetRelative.split("/"));
  const targetSiteRelative = relative(siteRoot, targetPath).split("\\").join("/");

  if (existsSync(targetPath)) {
    error(`slipway translate: target file already exists: ${targetSiteRelative}`);
    return 1;
  }

  const newFmData = { ...fm.data, lang: to };
  // The engine derives the direction from lang; a copied dir would stop that.
  delete newFmData.dir;
  if (newFmData.permalink !== undefined) {
    newFmData.permalink = translatedPermalink(newFmData.permalink, sourcePrefix, targetLanguage.prefix);
  }

  const yamlString = Object.keys(newFmData).length > 0 ? `---\n${yaml.stringify(newFmData)}---\n` : "";
  const newContent = `${yamlString}${bodyAfterFrontMatter(readFileSync(sourcePath, "utf8"))}`;

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, newContent, "utf8");

  if (format === "json") {
    log(JSON.stringify({
      source: siteRelativeSource,
      target: targetSiteRelative,
      lang: to,
      translation_key: translationKey
    }, null, 2));
  } else {
    log(`Translated ${siteRelativeSource} to ${targetSiteRelative} for language ${to}`);
  }

  return 0;
}

/** Translates a page on a Jekyll site by `slipway.languages` in `_config.yml`. Returns the exit code. */
function translateJekyllSite(siteRoot, sourcePath, to, format, { log, error }, site) {
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

  const newFmData = { ...fm.data, lang: to };

  const yamlString = Object.keys(newFmData).length > 0 ? `---\n${yaml.stringify(newFmData)}---\n` : "";
  const newContent = `${yamlString}${bodyAfterFrontMatter(readFileSync(sourcePath, "utf8"))}`;

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
  const config = site.config();
  if (config) return translateEngineSite(siteRoot, sourcePath, to, format, { log, error }, site, config);
  return translateJekyllSite(siteRoot, sourcePath, to, format, { log, error }, site);
}
