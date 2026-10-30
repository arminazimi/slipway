// Copies the regions a site embeds with `{% include snippet.html file="..." region="..." %}`
// into `_data/snippets.json`, because a classic Pages build cannot read files outside the site.
// Usage: node tools/snippets/sync.mjs [site] [--check]
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const languages = {
  c: "c", css: "css", go: "go", html: "html", java: "java", js: "js", json: "json", jsx: "jsx",
  md: "md", mjs: "js", py: "python", rb: "ruby", rs: "rust", sh: "sh", ts: "ts", tsx: "tsx",
  txt: "text", yml: "yaml", yaml: "yaml",
};
const skip = new Set([".git", "_site", "node_modules", "_data"]);
const marker = /^\s*(?:\/\/|#|;|--|%|\/\*|\*|<!--)\s*(end)?region(?:\s+([\w.-]+))?\s*(?:\*\/|-->)?\s*$/;
const include = /\{%-?\s*include\s+snippet\.html\s+([^%]*?)-?%\}/g;

/** The key both this tool and _includes/snippet.html build from a file and a region. */
export function key(file, region) {
  const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `${slug(file)}--${slug(region)}`;
}

/** The lines between `region <name>` and `endregion` in `text`, with the 1-based line of the first one. */
export function region(text, name) {
  const lines = text.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    const found = lines[i].match(marker);
    if (!found) continue;
    if (found[1]) {
      if (start >= 0) return { line: start + 2, lines: lines.slice(start + 1, i) };
    } else if (start < 0 && (!found[2] || found[2] === name)) start = i;
  }
  return start >= 0 ? { error: "region has no endregion" } : null;
}

function pages(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) pages(path, out);
    else if (/\.(?:md|html)$/.test(name)) out.push(path);
  }
  return out;
}

/** Every snippet a site asks for, keyed for _data/snippets.json. Throws on a missing region. */
export function collect(site) {
  const data = {};
  const problems = [];
  for (const page of pages(site)) {
    const text = readFileSync(page, "utf8");
    for (const [whole, attrs] of text.matchAll(include)) {
      const options = Object.fromEntries([...attrs.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
      if (!options.file || !options.region) {
        problems.push(`${relative(site, page)}: snippet include needs file and region: ${whole.trim()}`);
        continue;
      }
      const source = resolve(site, options.file);
      if (!existsSync(source)) {
        problems.push(`${relative(site, page)}: no file named ${options.file} for region ${options.region}`);
        continue;
      }
      const found = region(readFileSync(source, "utf8"), options.region);
      if (!found) {
        problems.push(`${relative(site, page)}: no region ${options.region} in ${options.file}`);
        continue;
      }
      if (found.error) {
        problems.push(`${relative(site, page)}: ${found.error} after region ${options.region} in ${options.file}`);
        continue;
      }
      data[key(options.file, options.region)] = {
        file: options.file,
        region: options.region,
        line: found.line,
        lang: languages[options.file.split(".").pop().toLowerCase()] || "text",
        text: found.lines.join("\n"),
      };
    }
  }
  if (problems.length) throw new Error(problems.join("\n"));
  return data;
}

/** The JSON text for a site's snippets, sorted by key so a diff stays small. */
export function render(data) {
  const sorted = Object.fromEntries(Object.keys(data).sort().map((k) => [k, data[k]]));
  return JSON.stringify(sorted, null, 2) + "\n";
}

export function main(argv = process.argv.slice(2)) {
  const check = argv.includes("--check");
  const site = resolve(argv.find((arg) => !arg.startsWith("--")) || ".");
  const out = join(site, "_data", "snippets.json");
  let text;
  try {
    text = render(collect(site));
  } catch (error) {
    console.error(`FAIL: snippets: ${error.message}`);
    process.exitCode = 1;
    return;
  }
  const current = existsSync(out) ? readFileSync(out, "utf8") : null;
  if (check) {
    if (current !== text) {
      console.error(`FAIL: ${relative(process.cwd(), out)} is stale; run node tools/snippets/sync.mjs ${relative(process.cwd(), site)}`);
      process.exitCode = 1;
    } else console.log(`OK: snippets (${Object.keys(JSON.parse(text)).length} copied)`);
    return;
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, text);
  console.log(`wrote ${relative(process.cwd(), out)} (${Object.keys(JSON.parse(text)).length} snippets)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
