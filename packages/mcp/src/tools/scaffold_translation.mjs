import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import * as yaml from "yaml";
import { Site } from "../../../doctor/src/site.mjs";
import { splitFrontMatter } from "../../../doctor/src/yaml.mjs";
import { insideSite } from "../tools.mjs";

export const definition = {
  name: "scaffold_translation",
  description: "Create a page in another site language with the same translation_key, target lang, headings as placeholders, and rewritten links.",
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

export function scaffoldTranslation(siteDir, { source, lang, translation_key }) {
  const sourcePath = insideSite(siteDir, source);

  const site = new Site(siteDir);
  const fm = site.frontMatterOf(source);

  if (!fm || !fm.data) {
    throw new Error(`source page must have front matter: ${source}`);
  }
  if (fm.error) {
    throw new Error(`source page front matter error: ${fm.error}`);
  }

  const configRes = site.dataOf("_config.yml");
  let prefix = `/${lang}`;
  if (configRes && !configRes.error && configRes.data && configRes.data.slipway && configRes.data.slipway.languages) {
    const langConfig = configRes.data.slipway.languages.find(l => l.code === lang);
    if (langConfig && langConfig.prefix !== undefined) {
      prefix = langConfig.prefix;
    }
  }

  const cleanPrefix = prefix.startsWith("/") ? prefix.slice(1) : prefix;

  let targetRelative = source;
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

  const targetPathRelative = cleanPrefix ? join(cleanPrefix, targetRelative).replace(/\\/g, "/") : targetRelative;
  const targetPath = join(siteDir, targetPathRelative);

  if (existsSync(targetPath)) {
    throw new Error(`target file already exists: ${targetPathRelative}`);
  }

  const sourceContent = readFileSync(sourcePath, "utf8");
  const block = splitFrontMatter(sourceContent);
  let bodyLines = [];
  if (block) {
    const lines = sourceContent.split(/\r?\n/);
    bodyLines = lines.slice(block.offset + block.text.split(/\r?\n/).length + 1);
  } else {
    bodyLines = sourceContent.split(/\r?\n/);
  }

  const newFmData = { ...fm.data, lang, translation_key };

  const sortedFmKeys = Object.keys(newFmData).sort();
  const sortedFmData = {};
  for (const k of sortedFmKeys) sortedFmData[k] = newFmData[k];

  const yamlString = Object.keys(sortedFmData).length > 0 ? `---\n${yaml.stringify(sortedFmData)}---\n` : "";

  const processedLines = [];
  const linesWhereLinksWereRewritten = [];

  const sitePages = site.files();

  const urlToFile = new Map();
  for (const p of sitePages) {
      if (!/\.(md|markdown|html)$/i.test(p)) continue;
      const fileFm = site.frontMatterOf(p);
      let pageUrl = "/" + p.replace(/\.(md|markdown)$/i, ".html");
      if (pageUrl.endsWith("/index.html")) pageUrl = pageUrl.slice(0, -10);
      if (pageUrl === "") pageUrl = "/";
      if (fileFm && fileFm.data && typeof fileFm.data.permalink === "string") {
          pageUrl = fileFm.data.permalink;
      }
      urlToFile.set(pageUrl, p);
  }

  const keyToTranslatedUrls = new Map();
  for (const p of sitePages) {
      if (!/\.(md|markdown|html)$/i.test(p)) continue;
      const fileFm = site.frontMatterOf(p);
      if (fileFm && fileFm.data && fileFm.data.lang === lang && fileFm.data.translation_key) {
          let pageUrl = "/" + p.replace(/\.(md|markdown)$/i, ".html");
          if (pageUrl.endsWith("/index.html")) pageUrl = pageUrl.slice(0, -10);
          if (pageUrl === "") pageUrl = "/";
          if (typeof fileFm.data.permalink === "string") {
              pageUrl = fileFm.data.permalink;
          }
          keyToTranslatedUrls.set(fileFm.data.translation_key, pageUrl);
      }
  }

  const offset = block ? block.offset + block.text.split(/\r?\n/).length + 1 : 0;

  for (let i = 0; i < bodyLines.length; i++) {
    let lineText = bodyLines[i];

    const headingMatch = lineText.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
       processedLines.push(lineText);
       continue;
    }

    let lineModified = false;
    let newLineText = "";
    let lastIndex = 0;

    const linkRegex = /\[([^\]]*?)\]\((.*?)\)/g;
    let match;

    while ((match = linkRegex.exec(lineText)) !== null) {
        newLineText += lineText.slice(lastIndex, match.index);
        lastIndex = linkRegex.lastIndex;

        const text = match[1];
        const url = match[2];
        let newUrl = url;

        let parsedUrl;
        try {
           parsedUrl = new URL(url, "http://localhost");
           if (parsedUrl.hostname === "localhost" && url.startsWith("/")) {
               let pathOnly = parsedUrl.pathname;
               // Map `/about/` to `/about.html` if `/about/` isn't found
               if (pathOnly.endsWith("/") && pathOnly.length > 1) {
                   pathOnly = pathOnly.slice(0, -1) + ".html";
               } else if (!pathOnly.endsWith(".html") && pathOnly !== "/") {
                   pathOnly = pathOnly + ".html";
               }

               let sourceFile = urlToFile.get(pathOnly);

               if (sourceFile) {
                    const linkFm = site.frontMatterOf(sourceFile);
                    if (linkFm && linkFm.data && linkFm.data.translation_key) {
                        const tKey = linkFm.data.translation_key;
                        const translatedUrl = keyToTranslatedUrls.get(tKey);
                        if (translatedUrl) {
                            newUrl = translatedUrl;

                            // Let's ensure if original url was `/about/` and translatedUrl is `/fa/about.html`, we might want to map back to `/fa/about/` if permaLink wasn't explicitly set.
                            // But usually outputting the raw mapped URL from `urlToFile` logic is fine.
                            // The URL we found in map was `/fa/about.html` from `about.md`. If we want to replace `.html` with `/` if original had `/`:
                            if (url.endsWith("/") && newUrl.endsWith(".html")) {
                                newUrl = newUrl.slice(0, -5) + "/";
                            }

                            newUrl = newUrl + (parsedUrl.hash || "") + (parsedUrl.search || "");
                            lineModified = true;
                        }
                    }
               }
           }
        } catch(e) {
           // ignore
        }

        newLineText += `[${text}](${newUrl})`;
    }

    newLineText += lineText.slice(lastIndex);

    processedLines.push(newLineText);

    if (lineModified) {
        linesWhereLinksWereRewritten.push(i + offset + 1);
    }
  }

  const newContent = `${yamlString}${processedLines.join("\n")}`;

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, newContent, "utf8");

  return {
    file: targetPathRelative,
    status: "created",
    lines: linesWhereLinksWereRewritten
  };
}

export const handler = (site, args) => scaffoldTranslation(site, args);
