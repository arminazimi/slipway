// The Markdown plugin that puts data-source="<source>:<line>" on every heading.
//
// Astro 7 and Starlight 0.42 run the Sätteri Markdown pipeline, whose plugins are visitor
// objects (the unified remark plugin, an async function, is gone). `remarkSource` keeps its
// name so the adapters read alike; it is passed to `satteri({ mdastPlugins: [remarkSource] })`.
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { headingLines } from "./markdown.mjs";

const toPosix = (path) => path.split(sep).join("/");
const inside = (path) => path && !path.startsWith("..") && !isAbsolute(path);
const configs = ["js", "mjs", "cjs", "ts", "mts", "cts"].map((ext) => `astro.config.${ext}`);
const siteDirs = new Map();
const offsets = new Map();

/** Heading text without the Markdown that would keep a source heading from matching the parsed one. */
const plain = (text) =>
  text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[0-9a-f]+);/gi, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

/** The folder holding `astro.config.*` at or above `dir`, or null. */
function siteDirOf(dir) {
  if (!siteDirs.has(dir)) {
    const parent = dirname(dir);
    siteDirs.set(dir, configs.some((name) => existsSync(join(dir, name))) ? dir : parent === dir ? null : siteDirOf(parent));
  }
  return siteDirs.get(dir);
}

/**
 * The Sätteri Markdown plugin for every document. Use `mdastPlugins: [remarkSource()]`
 * rather than `[remarkSource]`: this function is not a valid plugin factory (its argument,
 * when one is passed, is not the context Sätteri sends).
 * It adds `data-source` to every heading, with the file's path from the site folder and
 * the line counted from the top of the file, front matter included.
 */
export function remarkSource() {
  return visitor();
}

function visitor() {
  return {
    name: "slipway-source",
    // Sätteri skips position tracking unless a plugin asks for it.
    options: { position: true },
    heading(node, ctx) {
      if (!ctx.fileURL || !node.position) return;
      const path = fileURLToPath(ctx.fileURL);
      const siteDir = siteDirOf(dirname(path));
      const source = siteDir && toPosix(relative(siteDir, path));
      if (!inside(source)) return;
      // Sätteri reports positions in the body it parses, without the front matter (and MDX
      // keeps them absolute). Find the file's offset once from its first heading, then add it.
      let offset = offsets.get(path);
      if (offset === undefined) {
        const text = plain(ctx.textContent(node));
        const found = headingLines(readFileSync(path, "utf8")).find((h) => h.level === node.depth && plain(h.text) === text);
        offset = found ? found.line - node.position.start.line : 0;
        offsets.set(path, offset);
      }
      const current = node.data?.hProperties ?? {};
      ctx.setProperty(node, "data", {
        ...(node.data ?? {}),
        hProperties: { ...current, "data-source": `${source}:${node.position.start.line + offset}` },
      });
    },
  };
}

export default remarkSource;
