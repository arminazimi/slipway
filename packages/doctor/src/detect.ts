// Detects a site's generator from marker files only: no generator runs and no config is evaluated.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const isFile = (dir, name) => existsSync(join(dir, name)) && statSync(join(dir, name)).isFile();
const isDir = (dir, name) => existsSync(join(dir, name)) && statSync(join(dir, name)).isDirectory();
const anyFile = (dir, names) => names.some((name) => isFile(dir, name));
/** True when a file named `stem.<ext>` exists, for any extension. */
const stemFile = (entries, stem) => entries.some((name) => name.startsWith(`${stem}.`));

/**
 * Generators in tie-break order. `match` returns the marker's strength: 2 for a config file
 * only that generator uses, 1 for a weaker marker, 0 for none. Folders are the defaults,
 * relative to the site folder.
 */
const generators = [
  {
    generator: "hugo",
    sourceDir: "content",
    outputDir: "public",
    match: (dir) => {
      if (anyFile(dir, ["hugo.toml", "hugo.yaml", "hugo.yml", "hugo.json"])) return 2;
      return isFile(dir, "config.toml") && /^\s*baseURL\s*=/im.test(readFileSync(join(dir, "config.toml"), "utf8")) ? 1 : 0;
    },
  },
  { generator: "starlight", sourceDir: "src", outputDir: "dist", match: (dir, entries) => (stemFile(entries, "astro.config") && readFileSync(join(dir, entries.find(n => n.startsWith("astro.config."))), "utf8").includes("starlight") ? 2 : 0) },
  { generator: "astro", sourceDir: "src", outputDir: "dist", match: (dir, entries) => (stemFile(entries, "astro.config") && !readFileSync(join(dir, entries.find(n => n.startsWith("astro.config."))), "utf8").includes("starlight") ? 2 : 0) },
  { generator: "docusaurus", sourceDir: "docs", outputDir: "build", match: (dir, entries) => (stemFile(entries, "docusaurus.config") ? 2 : 0) },
  { generator: "mkdocs", sourceDir: "docs", outputDir: "site", match: (dir) => (anyFile(dir, ["mkdocs.yml", "mkdocs.yaml"]) ? 2 : 0) },
  {
    generator: "eleventy",
    sourceDir: ".",
    outputDir: "_site",
    match: (dir, entries) => (isFile(dir, ".eleventy.js") || stemFile(entries, "eleventy.config") ? 2 : 0),
  },
  {
    // `_config.yml` alone is too common to count: it needs a Gemfile or `_layouts` beside it.
    generator: "jekyll",
    sourceDir: ".",
    outputDir: "_site",
    match: (dir) => (isFile(dir, "_config.yml") && (isFile(dir, "Gemfile") || isDir(dir, "_layouts")) ? 1 : 0),
  },
  { generator: "nextra", sourceDir: "pages", outputDir: ".next", match: (dir, entries) => (stemFile(entries, "theme.config") ? 2 : 0) },
  { generator: "vitepress", sourceDir: ".", outputDir: ".vitepress/dist", match: (dir) => (isDir(dir, ".vitepress") && stemFile(readdirSync(join(dir, ".vitepress")), "config") ? 2 : 0) },
  { generator: "zola", sourceDir: "content", outputDir: "public", match: (dir) => (isFile(dir, "config.toml") && /^\s*base_url\s*=/im.test(readFileSync(join(dir, "config.toml"), "utf8")) ? 1 : 0) },
  { generator: "mdbook", sourceDir: "src", outputDir: "book", match: (dir) => (isFile(dir, "book.toml") ? 2 : 0) },
  { generator: "hexo", sourceDir: "source", outputDir: "public", match: (dir) => (isFile(dir, "_config.yml") && readFileSync(join(dir, "_config.yml"), "utf8").includes("Hexo") ? 1 : 0) },
  { generator: "quarto", sourceDir: ".", outputDir: "_site", match: (dir) => (isFile(dir, "_quarto.yml") ? 2 : 0) },
  { generator: "sphinx", sourceDir: ".", outputDir: "_build/html", match: (dir) => (isFile(dir, "conf.py") ? 2 : 0) },
  { generator: "pelican", sourceDir: "content", outputDir: "output", match: (dir) => (isFile(dir, "pelicanconf.py") ? 2 : 0) },
];

/**
 * Returns `{ generator, sourceDir, outputDir, confidence, candidates }`. `confidence` is `high`
 * for one marker, `low` when markers of several generators are present (the strongest wins),
 * and `none` for `unknown`, whose folders are `null`. `candidates` lists every generator found.
 */
export function detect(dir) {
  const entries = isDir(dir, ".") ? readdirSync(dir) : [];
  const found = entries.length
    ? generators.map((g) => ({ ...g, strength: g.match(dir, entries) })).filter((g) => g.strength > 0)
    : [];
  if (!found.length) return { generator: "unknown", sourceDir: null, outputDir: null, confidence: "none", candidates: [] };
  const best = found.reduce((a, b) => (b.strength > a.strength ? b : a));
  return {
    generator: best.generator,
    sourceDir: best.sourceDir,
    outputDir: best.outputDir,
    confidence: found.length === 1 ? "high" : "low",
    candidates: found.map((g) => g.generator),
  };
}
