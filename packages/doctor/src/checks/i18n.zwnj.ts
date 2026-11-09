// Persian attaches the prefixes می and نمی and the suffixes ها، تر، and ترین with a
// zero-width non-joiner. This check reads prose only (prose.ts drops code, front
// matter, HTML, URLs, and Liquid) and reports each missing joiner with a suggestion.
// It reads a page's language from the built page the manifest names, so an English
// page that quotes Persian text is not judged by a Persian typography rule.
import { startTags } from "../html.ts";
import { prose } from "../prose.ts";

export const id = "i18n.zwnj";
export const level = "warning";

const ZWNJ = "\u200c";
const LETTER = /\p{Script=Arabic}/u;
const SCRIPT = "[\\p{Script=Arabic}\\u200c]";
// Words that start with the letters می but are not the prefix: میز (table), میوه (fruit), and so on.
const NOT_PREFIX = new Set(["میز", "میوه", "میان", "میلیون", "میلیارد", "میلی", "میکرو", "مینا", "میراث", "میرزا", "میکا", "میگو", "میدان", "میخ", "میخک", "میخانه", "میهن", "میکروب", "میل", "میله", "میمون", "میر", "میزان", "میگا"]);
const SUFFIXES = new Set(["ها", "های", "هایی", "هایم", "هایت", "هایش", "هایمان", "هایتان", "هایشان", "هاست", "تر", "ترین"]);
const core = (token) => token.text.replace(/^[^\p{Script=Arabic}\u200c]+|[^\p{Script=Arabic}\u200c]+$/gu, "");

/** The site's language: the engine config's `lang`, then Jekyll's `_config.yml`, else null. */
function siteLanguage(site) {
  const engineLang = site.config()?.data?.lang;
  if (typeof engineLang === "string" && engineLang.trim()) return engineLang.trim();
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (!site.isFile(site.source, name)) continue;
    const lang = site.dataOf(name)?.data?.lang;
    return typeof lang === "string" && lang.trim() ? lang.trim() : null;
  }
  return null;
}

/** The code of the language whose URL prefix the page sits under, from the engine config's `languages`. */
function prefixLanguage(site, file) {
  const segments = file.replace(/\\/g, "/").replace(/^\.?\//, "").split("/").filter(Boolean);
  const languages = site.config()?.data?.languages;
  if (!Array.isArray(languages)) return null;
  for (const language of languages) {
    const parts = typeof language?.prefix === "string" ? language.prefix.split("/").filter(Boolean) : [];
    if (parts.length > 0 && parts.every((part, i) => segments[i] === part) && typeof language.code === "string") return language.code;
  }
  return null;
}

/** The language a built page declares on `<html lang>`, read through the output the manifest names. */
function builtLanguage(site, source, pages) {
  const output = (pages.get(source)?.outputs ?? []).find((file) => typeof file === "string" && /\.html?$/i.test(file));
  if (!output || !site.build || !site.isFile(site.build, output)) return null;
  for (const tag of startTags(site.readOutput(output))) {
    if (tag.name !== "html") continue;
    return tag.attributes.get("lang")?.trim() || null;
  }
  return null;
}

/** The page's language: the built page the manifest names, front matter `lang`, its URL prefix, then the site. */
function pageLanguage(site, file, frontMatter, pages) {
  const declared = frontMatter?.data?.lang;
  return (
    builtLanguage(site, file, pages) ??
    (typeof declared === "string" && declared.trim() ? declared.trim() : null) ??
    prefixLanguage(site, file) ??
    siteLanguage(site)
  );
}

/** Whether the rule applies: Persian, or a page whose language nothing states. */
const persian = (lang) => lang === null || /^fa(-|$)/i.test(lang);

/** The findings for one prose run; `column` is the run's 1-based column in the file. */
function scan(text, line, column, file, findings) {
  const push = (index, length, replacement, columnIndex, why) => {
    const suggested = (text.slice(0, index) + replacement + text.slice(index + length)).trim();
    findings.push({ in: "source", file, line, column: column + columnIndex, message: `${why}; write ${JSON.stringify(suggested)}`, fix: suggested });
  };

  const tokens = [...text.matchAll(/\S+/g)].map((match) => ({ text: match[0], start: match.index }));
  tokens.forEach((token, i) => {
    const value = core(token);
    if (!value) return;
    const offset = token.start + token.text.indexOf(value);
    const previous = i > 0 ? tokens[i - 1] : null;
    const previousValue = previous ? core(previous) : "";
    const joined = value.includes(ZWNJ);

    // A suffix written as its own word: «کتاب ها» -> «کتاب‌ها».
    if (SUFFIXES.has(value) && previous && LETTER.test(previousValue)) {
      const gapStart = previous.start + previous.text.length;
      if (/^\s+$/.test(text.slice(gapStart, offset))) push(gapStart, offset - gapStart, ZWNJ, offset, `writes ${JSON.stringify(value)} as its own word`);
      return;
    }

    // A prefix written as its own word: «می خواهم» -> «می‌خواهم».
    if ((value === "می" || value === "نمی") && tokens[i + 1]) {
      const next = core(tokens[i + 1]);
      if (next && LETTER.test(next)) {
        const gapStart = token.start + token.text.length;
        const gapEnd = tokens[i + 1].start;
        push(gapStart, gapEnd - gapStart, ZWNJ, offset, `writes ${JSON.stringify(value)} as its own word`);
      }
      return;
    }

    if (joined) return;

    // A joined plural: «کتابها» -> «کتاب‌ها». Stems of two letters (تنها، آنها) stay joined.
    // This comes before the prefix rule so «میدانها» splits before ها, not after می.
    const plural = new RegExp(`^(${SCRIPT}{3,})(ها(?:ی(?:م|ت|ش|مان|تان|شان)?|ست)?)$`, "u").exec(value);
    if (plural) {
      push(offset + plural[1].length, 0, ZWNJ, offset + plural[1].length, "joins the plural suffix to the word");
      return;
    }

    // A joined prefix: «میخواهم» -> «می‌خواهم». نمی has no everyday words of its own.
    const prefix = /^(می|نمی)(?=\p{Script=Arabic})/u.exec(value);
    if (prefix && !(prefix[1] === "می" && NOT_PREFIX.has(value))) {
      push(offset + prefix[1].length, 0, ZWNJ, offset, `joins ${JSON.stringify(prefix[1])} to the word`);
    }
  });
}

export async function run(site) {
  const pages = new Map(site.pages().map((page) => [page?.source, page]));
  const findings = [];
  for (const file of site.files()) {
    if (!/\.(md|markdown)$/i.test(file)) continue;
    const text = site.read(file);
    if (text === null) continue;
    const lang = pageLanguage(site, file, site.frontMatterOf(file), pages);
    if (!persian(lang)) continue;
    for (const item of prose({ text }).runs) scan(item.text, item.line, item.column, file, findings);
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
  return { status: findings.length ? "fail" : "pass", findings };
}
