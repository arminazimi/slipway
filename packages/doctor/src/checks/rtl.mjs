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
export function unisolatedText(element) {
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

export const allText = (element) => element.children.map((child) => child.text ?? allText(child)).join("");
export const mixed = (text) => strongRtl.test(text) && strongLtr.test(text);

/** Where a finding on a built page points: the source line when the page or the map gives it, else the output line. */
export function locate(site, file, element, kind, pages) {
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

export function sourcemapPages(site) {
  const pages = site.sourcemap()?.data?.pages;
  return Array.isArray(pages) ? pages : [];
}


