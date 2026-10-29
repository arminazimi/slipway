import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { globSync } from "glob";
import { headingsIn, linksIn, splitFrontMatter } from "./markdown.mjs";

const toPosix = (path) => path.split(sep).join("/");
const inside = (path) => path && !path.startsWith("..") && !isAbsolute(path);
export const twinUrl = (url) => (url.endsWith("/") ? `${url}index.md` : `${url.replace(/\.html$/, "")}.md`);
export function twinOf(raw, title) {
  const body = splitFrontMatter(raw).body.replace(/^\s*\n/, "");
  return title && !/^#[ \t]/.test(body) ? `# ${title}\n\n${body}` : body;
}

const dir = process.argv[2] || process.cwd();
const outDir = join(dir, "public");

const map = { version: 0, pages: [] };

// Zola does not expose an AST or hook to easily modify headings, but we can do a post-build HTML pass
// to inject data-source if we know where things came from.
// Or actually, Zola doesn't have a markdown plugin system. So we must parse the HTML and the markdown source,
// and map headings from the HTML to the markdown source by their text and level.

function findHeadingLine(raw, level, plainTextHtml, offset) {
  const lines = raw.split(/\r?\n/);
  // simplified heading matcher
  const atx = new RegExp(`^#{${level}}\\s+(.*)`);
  // also setext:
  const setext1 = /^=+$/;
  const setext2 = /^-+$/;

  const sanitize = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = sanitize(plainTextHtml);

  for (let i = offset; i < lines.length; i++) {
    const line = lines[i];
    let matchText = null;
    const mAtx = line.match(atx);
    if (mAtx) {
      matchText = mAtx[1];
    } else if (level === 1 && i > 0 && setext1.test(line)) {
      matchText = lines[i-1];
    } else if (level === 2 && i > 0 && setext2.test(line)) {
      matchText = lines[i-1];
    }

    if (matchText !== null) {
      if (sanitize(matchText).includes(target) || target.includes(sanitize(matchText))) {
        // Clear this heading out so repeated headings get the next one.
        lines[i] = "";
        return i + 1; // 1-based
      }
    }
  }
  return null;
}

const mdFiles = globSync("content/**/*.md", { cwd: dir });

// map markdown files to their generated html files based on zola routing rules.
// _index.md -> index.html in the same directory.
// slug.md -> slug/index.html
function getHtmlPath(mdPath) {
  if (mdPath.endsWith("_index.md")) {
    return mdPath.replace("content/", "").replace("_index.md", "index.html");
  } else {
    return mdPath.replace("content/", "").replace(".md", "/index.html");
  }
}

for (const mdFile of mdFiles) {
  const source = mdFile;
  const raw = readFileSync(join(dir, source), "utf8");
  const htmlRel = getHtmlPath(source);
  const htmlPath = join(outDir, htmlRel);

  if (!existsSync(htmlPath)) continue;
  let html = readFileSync(htmlPath, "utf8");

  const foundHeadings = headingsIn(html);
  const { offset } = splitFrontMatter(raw);

  // Clone raw so we can mutate lines (clear out matched headings)
  const lines = raw.split(/\r?\n/);
  const sanitize = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

  function findLine(level, plainText) {
    const target = sanitize(plainText);
    const atx = new RegExp(`^#{${level}}\\s+(.*)`);
    const setext1 = /^=+$/;
    const setext2 = /^-+$/;
    let openFence = false;
    for (let i = offset; i < lines.length; i++) {
      if (lines[i].startsWith("```") || lines[i].startsWith("~~~")) {
        openFence = !openFence;
        continue;
      }
      if (openFence) continue;
      let matchText = null;
      const mAtx = lines[i].match(atx);
      if (mAtx) {
        matchText = mAtx[1];
      } else if (level === 1 && i > 0 && setext1.test(lines[i])) {
        matchText = lines[i-1];
      } else if (level === 2 && i > 0 && setext2.test(lines[i])) {
        matchText = lines[i-1];
      }

      if (matchText !== null && (sanitize(matchText).includes(target) || target.includes(sanitize(matchText)))) {
        lines[i] = ""; // consume
        return i + 1; // 1-based line number (if setext, the line number is the underline. Oh wait, Hugo adapter uses the text line or underline? Let's use the text line)
      }
    }
    return null;
  }

  const sections = [];
  let modifiedHtml = html;

  for (const h of foundHeadings) {
    const lineNum = findLine(h.level, h.text);
    if (lineNum !== null) {
      sections.push({ id: h.id, level: h.level, line: lineNum, text: h.text });
      // inject data-source
      const search = new RegExp(`<h${h.level}\\b([^>]*)id="${h.id}"([^>]*)>`);
      modifiedHtml = modifiedHtml.replace(search, `<h${h.level} $1id="${h.id}"$2 data-source="${source}:${lineNum}">`);
    }
  }

  if (modifiedHtml !== html) {
    writeFileSync(htmlPath, modifiedHtml);
  }

  // Determine URL based on htmlRel
  let url = "/" + toPosix(htmlRel).replace(/index\.html$/, "");
  if (url !== "/") url = url.replace(/\/$/, "") + "/";

  map.pages.push({ url, source, sections, links: linksIn(raw) });

  // Build twin
  const twin = twinUrl(url);
  const twinFile = join(outDir, twin.startsWith("/") ? twin.slice(1) : twin);
  mkdirSync(dirname(twinFile), { recursive: true });
  const match = raw.match(/^title:\s*(.+)$/m) || raw.match(/^title\s*=\s*(.+)$/m);
  const title = match ? match[1].replace(/^["']|["']$/g, "").trim() : null;
  writeFileSync(twinFile, twinOf(raw, title));

  // Inject link alternate tag
  const tag = `<link rel="alternate" type="text/markdown" href="${twin}">`;
  if (!modifiedHtml.includes(tag)) writeFileSync(htmlPath, modifiedHtml.replace("</head>", `${tag}\n</head>`));
}

writeFileSync(join(outDir, "sourcemap.json"), `${JSON.stringify(map, null, 2)}\n`);
