import { rtlLanguages, unisolatedText, mixed, allText, locate, sourcemapPages } from "./rtl.mjs";
import { parse, walk } from "../html.mjs";
import { failWith, noOutput } from "../utils.mjs";

export const id = "ae.rtl.bidi-isolated";
export const level = "warning";

export function run(site) {
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
}
