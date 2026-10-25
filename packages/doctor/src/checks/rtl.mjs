// Right-to-left checks on the built HTML, for any generator: `lang` and `dir` agree on <html>, and
// titles, h1 headings, and nav links that mix right-to-left and left-to-right text isolate one of them.
import { parse, walk } from "../html.mjs";

const noOutput = { status: "fail", findings: [{ message: "needs the output folder: pass --build <dir>" }] };
const failWith = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

/** Primary language subtags written right to left. */
export const rtlLanguages = new Set(["ar", "arc", "ckb", "dv", "fa", "he", "ks", "ps", "sd", "ug", "ur", "yi"]);

const rtlScripts = "\\p{Script=Arabic}\\p{Script=Hebrew}\\p{Script=Syriac}\\p{Script=Thaana}\\p{Script=Nko}\\p{Script=Samaritan}\\p{Script=Mandaic}\\p{Script=Adlam}\\p{Script=Hanifi_Rohingya}";
const strongRtl = new RegExp(`[${rtlScripts}]`, "u");
const strongLtr = new RegExp(`[\\p{L}--[${rtlScripts}]]`, "v");
// LRI, RLI, and FSI open an isolate that PDI closes.
const isolates = /[⁦-⁨][^⁦-⁩]*⁩/g;

/** Text of an element outside any isolate: descendants that are `bdi` or carry `dir`, and isolate marks. */
function unisolatedText(element) {
  let text = "";
  const collect = (node) => {
    for (const child of node.children) {
      if (child.text !== undefined) text += child.text;
      else if (child.name !== "bdi" && !child.attributes.has("dir")) collect(child);
      else text += " ";
    }
  };
  collect(element);
  let previous;
  do {
    previous = text;
    text = text.replace(isolates, " ");
  } while (text !== previous);
  return text;
}

const allText = (element) => element.children.map((child) => child.text ?? allText(child)).join("");
const mixed = (text) => strongRtl.test(text) && strongLtr.test(text);

/** Where a finding on a built page points: the source line when the page or the map gives it, else the output line. */
function locate(site, file, element, kind, pages) {
  const dataSource = element.attributes.get("data-source")?.match(/^(.+):(\d+)$/);
  if (dataSource && site.isFile(site.source, dataSource[1])) return { in: "source", file: dataSource[1], line: Number(dataSource[2]) };
  const page = pages.find((p) => typeof p?.url === "string" && site.outputFile(p.url) === file);
  if (page && typeof page.source === "string" && site.isFile(site.source, page.source)) {
    if (kind === "h1") {
      const section = (page.sections ?? []).find((s) => s?.id === element.attributes.get("id"));
      if (Number.isInteger(section?.line)) return { in: "source", file: page.source, line: section.line };
    }
    if (kind === "title") {
      const fm = site.frontMatterOf(page.source);
      if (fm?.data && typeof fm.data.title === "string" && mixed(fm.data.title)) return { in: "source", file: page.source, line: fm.lineOf(["title"]) + fm.offset };
    }
  }
  return { in: "output", file, line: element.line };
}

function sourcemapPages(site) {
  const pages = site.sourcemap()?.data?.pages;
  return Array.isArray(pages) ? pages : [];
}

export const rtlChecks = {
  "ae.rtl.dir-matches-lang"(site) {
    if (!site.build) return noOutput;
    const findings = [];
    for (const file of site.outputHtml()) {
      for (const { element } of walk(parse(site.readOutput(file)))) {
        if (element.name !== "html") continue;
        const lang = element.attributes.get("lang")?.trim();
        if (!lang) break;
        const dir = element.attributes.get("dir")?.trim().toLowerCase();
        const rtl = rtlLanguages.has(lang.split(/[-_]/)[0].toLowerCase());
        const at = { in: "output", file, line: element.line, key: "html" };
        if (rtl && dir !== "rtl") findings.push({ ...at, message: `has lang="${lang}", a right-to-left language, ${dir ? `but dir="${dir}"` : "and no dir"}`, allowed: ["rtl"] });
        if (!rtl && dir === "rtl") findings.push({ ...at, message: `has dir="rtl" but lang="${lang}" is written left to right` });
        break;
      }
    }
    return failWith(findings);
  },

  "ae.rtl.bidi-isolated"(site) {
    if (!site.build) return noOutput;
    const pages = sourcemapPages(site);
    const findings = [];
    for (const file of site.outputHtml()) {
      for (const { element, ancestors } of walk(parse(site.readOutput(file)))) {
        const kind =
          element.name === "title" && !ancestors.some((a) => a.name === "svg")
            ? "title"
            : element.name === "h1"
              ? "h1"
              : element.name === "a" && ancestors.some((a) => a.name === "nav")
                ? "nav link"
                : null;
        if (!kind || !mixed(unisolatedText(element))) continue;
        const text = allText(element).replace(/\s+/g, " ").trim();
        findings.push({
          ...locate(site, file, element, kind, pages),
          key: kind === "nav link" ? "a" : kind,
          message: `${kind} ${JSON.stringify(text)} mixes right-to-left and left-to-right text without isolating either (use <bdi>, dir="auto", or FSI and PDI marks)`,
        });
      }
    }
    return failWith(findings);
  },
};
