import { rtlLanguages } from "./rtl.mjs";
import { parse, walk } from "../html.mjs";
import { failWith, noOutput } from "../utils.mjs";

export const id = "ae.rtl.dir-matches-lang";
export const level = "warning";

export function run(site) {
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
        if (rtl && dir !== "rtl") findings.push({ ...at, message: `has lang="${lang}", a right-to-left language, ${dir ? 'but dir="' + dir + '"' : "and no dir"}`, allowed: ["rtl"] });
        if (!rtl && dir === "rtl") findings.push({ ...at, message: `has dir="rtl" but lang="${lang}" is written left to right` });
        break;
      }
    }
    return failWith(findings);
}
