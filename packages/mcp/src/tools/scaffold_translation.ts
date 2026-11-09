import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, sep } from "node:path";
import * as yaml from "yaml";
import { loadConfig } from "../../../engine/src/config/load.ts";
import { pageLang } from "../../../engine/src/content/lang.ts";
import {
  comparablePath,
  contentRoot,
  frontMatterOf,
  insideSite,
  isExternal,
  markdownPages,
  pagePath,
  siteRelative,
  sourceRelative,
  withoutBase,
  withoutFragment,
} from "../tools.ts";

export const definition = {
  name: "scaffold_translation",
  description:
    "Create a page in another site language with the same translation_key, target lang, headings as placeholders, and rewritten links. Languages and prefixes come from mizzen.yml.",
  inputSchema: {
    type: "object",
    properties: {
      source: { type: "string", description: "Path to the source file, relative to the site directory." },
      lang: { type: "string", description: "Target language code." },
      translation_key: { type: "string", description: "The translation_key to use." },
    },
    required: ["source", "lang", "translation_key"],
    additionalProperties: false,
  },
};

/** Front matter a translation must not inherit: it names this page, its old URLs, or the source language's direction. */
const SOURCE_ONLY = new Set(["dir", "lang", "permalink", "redirect_from", "redirect_to", "translation_key"]);

/** A new relative URL from one page URL to another, keeping a pretty URL's trailing slash. */
function relativeTo(fromUrl: string, toUrl: string): string {
  const target = posix.relative(posix.dirname(fromUrl), toUrl);
  if (target === "") return toUrl.endsWith("/") ? "./" : ".";
  return toUrl.endsWith("/") ? `${target}/` : target;
}

/** The URL segments of a language prefix,such as `/fa` → `["fa"]`; `""` (the default language) has none. */
function prefixSegments(prefix: string): string[] {
  return prefix.split("/").filter((segment) => segment.length > 0);
}

/** The source page's path with the source language's URL prefix removed, if it has one. */
function withoutPrefix(sourceRel: string, prefix: string): string {
  const parts = sourceRel.split("/");
  const segments = prefixSegments(prefix);
  if (segments.length > 0 && segments.every((segment, index) => parts[index] === segment)) {
    return parts.slice(segments.length).join("/");
  }
  return sourceRel;
}

/** A page found in the site: its source-relative path, front matter, URL, language, and translation key. */
interface FoundPage {
  readonly path: string;
  readonly data: Record<string, unknown>;
  readonly url: string;
  readonly lang: string;
  readonly key?: string;
}

/** Every page, and the pages already translated into the target language, keyed by translation_key. */
function findPages(root: string, config: ReturnType<typeof loadConfig>["config"], lang: string): {
  byPath: Map<string, FoundPage>;
  byUrl: Map<string, FoundPage>;
  translated: Map<string, FoundPage>;
} {
  const byPath = new Map<string, FoundPage>();
  const byUrl = new Map<string, FoundPage>();
  const translated = new Map<string, FoundPage>();
  for (const path of markdownPages(root)) {
    const { data } = frontMatterOf(root, path);
    const url = pagePath(path, data);
    const page: FoundPage = {
      path,
      data,
      url,
      lang: pageLang(path, { config, frontMatter: data }).lang,
      ...(typeof data.translation_key === "string" ? { key: data.translation_key } : {}),
    };
    byPath.set(path, page);
    byUrl.set(comparablePath(url), page);
    if (page.key !== undefined && page.lang === lang) translated.set(page.key, page);
  }
  return { byPath, byUrl, translated };
}

export function scaffoldTranslation(
  siteDir: string,
  { source, lang, translation_key }: { source: string; lang: string; translation_key: string },
) {
  const base = realpathSync(siteDir);
  const sourcePath = insideSite(base, source);
  const fromRel = relative(base, sourcePath).split(sep).join("/");
  const loaded = loadConfig(base);
  const configError = loaded.diagnostics.find((diagnostic) => diagnostic.severity === "error");
  if (configError !== undefined) throw new Error(`mizzen.yml: ${configError.message}`);
  const config = loaded.config;
  const root = contentRoot(base, config.source);
  const fromSource = sourceRelative(fromRel, config.source);

  if (typeof lang !== "string" || lang.trim() === "") throw new Error("lang must name a language code");
  if (typeof translation_key !== "string" || translation_key.trim() === "") throw new Error("translation_key must not be empty");

  const sourceFrontMatter = frontMatterOf(root, fromSource);
  const error = sourceFrontMatter.diagnostics.find((diagnostic) => diagnostic.severity === "error");
  if (error !== undefined) throw new Error(`source page front matter error: ${error.message}`);

  const sourceLang = pageLang(fromSource, { config, frontMatter: sourceFrontMatter.data });
  if (sourceLang.lang === lang) throw new Error(`${source} is already in ${lang}; choose another language`);

  const language = config.languages.find((entry) => entry.code === lang);
  if (language === undefined && config.languages.length > 0) {
    const codes = config.languages.map((entry) => entry.code).join(", ");
    throw new Error(`${lang} is not one of the site's languages (${codes}) in mizzen.yml`);
  }
  const targetPrefix = language?.prefix ?? `/${lang}`;

  const sourceLanguage = config.languages.find((entry) => entry.code === sourceLang.lang);
  const withoutSourcePrefix = withoutPrefix(fromSource, sourceLanguage?.prefix ?? "");
  const targetSource = [prefixSegments(targetPrefix).join("/"), withoutSourcePrefix].filter((part) => part !== "").join("/");
  const targetRel = siteRelative(targetSource, config.source);
  const targetPath = join(base, targetRel);

  if (targetSource === fromSource) throw new Error("the translated page would overwrite the source page");
  if (existsSync(targetPath)) throw new Error(`target file already exists: ${targetRel}`);

  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(sourceFrontMatter.data)) {
    if (!SOURCE_ONLY.has(key)) data[key] = value;
  }
  data.lang = lang;
  data.translation_key = translation_key;

  const sortedData: Record<string, unknown> = {};
  for (const key of Object.keys(data).sort()) sortedData[key] = data[key];
  const yamlString = Object.keys(sortedData).length > 0 ? `---\n${yaml.stringify(sortedData)}---\n` : "";
  const bodyStartLine = yamlString.split("\n").length;

  const pages = findPages(root, config, lang);
  const sourceUrl = pagePath(fromSource, sourceFrontMatter.data);
  const targetUrl = pagePath(targetSource, data);

  const eol = sourceFrontMatter.body.includes("\r\n") ? "\r\n" : "\n";
  const bodyLines = sourceFrontMatter.body.split(/\r?\n/);
  const linkRegex = /(?<!!)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g;
  const changed: Array<{ file: string; line: number }> = [];
  const processedLines = bodyLines.map((lineText, index) => {
    if (/^#{1,6}\s/.test(lineText)) return lineText;
    let lineModified = false;
    let result = "";
    let last = 0;
    for (const match of lineText.matchAll(linkRegex)) {
      const label = match[1]!;
      const target = match[2]!;
      const title = match[3] ?? "";
      if (target === "" || isExternal(target) || target.startsWith("#")) continue;
      const bare = withoutFragment(target);
      const suffix = target.slice(bare.length);
      if (bare === "") continue;
      const absolute = bare.startsWith("/");
      const markdown = /\.(?:md|markdown)$/i.test(bare);
      let destination: string | undefined;

      if (markdown) {
        const file = absolute ? bare.replace(/^\/+/, "") : posix.normalize(posix.join(posix.dirname(fromSource), bare));
        const found = pages.byPath.get(file);
        if (found === undefined) continue;
        const translated = file === fromSource ? targetSource : (found.key === undefined ? undefined : pages.translated.get(found.key)?.path);
        const next = translated ?? file;
        destination = absolute ? `/${next}` : posix.relative(posix.dirname(targetSource), next);
      } else {
        const resolved = absolute
          ? comparablePath(withoutBase(bare, config.base))
          : comparablePath(posix.join(posix.dirname(sourceUrl), bare));
        const found = pages.byUrl.get(resolved);
        if (found === undefined) continue;
        const translated = found.path === fromSource
          ? { url: targetUrl }
          : (found.key === undefined ? undefined : pages.translated.get(found.key));
        const next = translated ?? found;
        destination = absolute ? next.url : relativeTo(targetUrl, next.url);
      }

      result += lineText.slice(last, match.index) + `[${label}](${destination}${suffix}${title})`;
      last = match.index! + match[0].length;
      lineModified = true;
    }
    if (!lineModified) return lineText;
    result += lineText.slice(last);
    if (result !== lineText) changed.push({ file: targetRel, line: bodyStartLine + index });
    return result;
  });

  const newContent = `${yamlString}${processedLines.join(eol)}`;
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, newContent, "utf8");

  const direction = pageLang(targetSource, { config, frontMatter: data }).dir;
  return {
    file: targetRel,
    status: "created",
    lang,
    dir: direction,
    files: [targetRel],
    changed,
  };
}

export const handler = (site, args) => scaffoldTranslation(site, args);
