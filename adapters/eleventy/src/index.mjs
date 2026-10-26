import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { headingsIn, linksIn, splitFrontMatter } from "./markdown.mjs";

const toPosix = (path) => path.split(sep).join("/");
const inside = (path) => path && !path.startsWith("..") && !isAbsolute(path);

/** The twin's URL path: the page's address with `.md` instead of `.html`, or `index.md` under an address that ends in `/`. */
export const twinUrl = (url) => (url.endsWith("/") ? `${url}index.md` : `${url.replace(/\.html$/, "")}.md`);

/** The twin: the page's Markdown as written, without front matter, under a title heading unless it starts with one. */
export function twinOf(raw, title) {
  const body = splitFrontMatter(raw).body.replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
}

export default function slipway(eleventyConfig) {
  // We need to instrument markdown-it to add `data-source` attributes to headings.
  eleventyConfig.amendLibrary("md", (mdLib) => {
    // We add a plugin to inject source lines. Eleventy does not easily expose the path in the markdown-it instance,
    // so we need a workaround or just rely on a transform.
    // However, Eleventy's markdown-it environment (env) does not reliably have the source file path across all versions,
    // but in 11ty 3.0, it is usually available in `env.page.inputPath`.
    mdLib.core.ruler.push("slipway_source", (state) => {
      const inputPath = state.env?.page?.inputPath;
      if (!inputPath) return;
      // Strip leading './' from inputPath
      const source = inputPath.startsWith("./") ? inputPath.slice(2) : inputPath;
      if (!inside(source)) return;

      const raw = readFileSync(inputPath, "utf8");
      const { offset } = splitFrontMatter(raw);

      for (const token of state.tokens) {
        if (token.type === "heading_open" && token.map) {
          const line = token.map[0] + 1 + offset;
          token.attrSet("data-source", `${source}:${line}`);
        }
      }
    });
  });

  eleventyConfig.on("eleventy.after", async ({ dir, results }) => {
    const map = { version: 0, pages: [] };
    const outDir = dir.output;
    let headings = 0;

    for (const result of results) {
      if (!result.inputPath || !result.outputPath || !result.url) continue;
      // Only process Markdown files
      if (!result.inputPath.endsWith(".md") && !result.inputPath.endsWith(".mdx")) continue;

      const source = result.inputPath.startsWith("./") ? result.inputPath.slice(2) : result.inputPath;
      if (!inside(source)) continue;

      const raw = readFileSync(source, "utf8");
      const html = readFileSync(result.outputPath, "utf8");
      const found = headingsIn(html);
      headings += found.filter((h) => h.source).length;

      const sections = found
        .filter((h) => h.id && h.source?.startsWith(`${source}:`))
        .map((h) => ({ id: h.id, level: h.level, line: Number(h.source.slice(source.length + 1)), text: h.text }))
        .filter((section) => Number.isInteger(section.line) && section.line > 0);

      map.pages.push({ url: result.url, source, sections, links: linksIn(raw) });

      // Build twin
      const url = result.url;
      const twin = twinUrl(url);
      const twinFile = join(outDir, ...twin.split("/").filter(Boolean));
      mkdirSync(dirname(twinFile), { recursive: true });
      // Front matter parsing for title in Eleventy results is available in result.content or we just parse it.
      // But we just use the split function. Actually we don't have the title easily available unless we read the frontmatter block.
      // Let's parse front matter title naively or use a regex for now.
      const match = raw.match(/^title:\s*(.+)$/m);
      const title = match ? match[1].replace(/^["']|["']$/g, "").trim() : null;
      writeFileSync(twinFile, twinOf(raw, title));

      // Inject link alternate tag
      const tag = `<link rel="alternate" type="text/markdown" href="${twin}">`;
      if (!html.includes(tag)) writeFileSync(result.outputPath, html.replace("</head>", `${tag}\n</head>`));
    }

    writeFileSync(join(outDir, "sourcemap.json"), `${JSON.stringify(map, null, 2)}\n`);
  });
}
