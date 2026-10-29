export const id = "doctor.lang-mismatch";
export const level = "warning";

import { blocks } from "../markdown.mjs";

const result = (findings) => ({ status: findings.length ? "fail" : "pass", findings });

const SCRIPTS = [
  "Latn", "Arab", "Cyrl", "Han", "Hebr", "Thaa", "Deva",
  "Beng", "Guru", "Gujr", "Orya", "Taml", "Telu", "Knda",
  "Mlym", "Sinh", "Thai", "Lao", "Mymr", "Khmr", "Geor",
  "Armn", "Ethi", "Grek", "Hang", "Hira", "Kana"
];

function expectedScripts(lang) {
  try {
    const sc = new Intl.Locale(lang).maximize().script;
    if (sc === "Hans" || sc === "Hant") return ["Han"];
    if (sc === "Jpan") return ["Hira", "Kana", "Han"];
    if (sc === "Kore") return ["Hang", "Han"];
    return [sc];
  } catch {
    return ["Latn"];
  }
}

export async function run(site) {
  let globalLang = "en";
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (site.isFile(site.source, name)) {
      const configParsed = site.dataOf(name);
      if (configParsed?.data?.lang) {
        globalLang = configParsed.data.lang;
      }
      break;
    }
  }

  const findings = [];
  const display = new Intl.DisplayNames(["en"], { type: "script" });

  for (const file of site.files()) {
    if (!file.endsWith(".md") && !file.endsWith(".markdown")) continue;

    const fm = site.frontMatterOf(file);
    const lang = fm?.data?.lang || globalLang;

    const content = site.read(file);
    if (content === null) continue;

    const proseBlocks = blocks(content).prose;
    const cleanLines = proseBlocks.map(({text}) => {
      return text
        .replace(/`[^`]+`/g, "") // remove inline code
        .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1") // markdown links -> just text
        .replace(/https?:\/\/[^\s]+/g, ""); // bare urls
    });

    const fullCleanText = cleanLines.join("\n");
    const letters = fullCleanText.match(/\p{L}/gu) || [];

    if (letters.length < 200) continue;

    const expScripts = expectedScripts(lang);
    let expectedCount = 0;
    for (const sc of expScripts) {
      expectedCount += (fullCleanText.match(new RegExp(`\\p{sc=${sc}}`, "gu")) || []).length;
    }

    let maxCount = 0;
    let dominantScript = null;
    for (const sc of SCRIPTS) {
      const count = (fullCleanText.match(new RegExp(`\\p{sc=${sc}}`, "gu")) || []).length;
      if (count > maxCount) {
        maxCount = count;
        dominantScript = sc;
      }
    }

    if (dominantScript && !expScripts.includes(dominantScript) && maxCount > expectedCount) {
      const dominantName = display.of(dominantScript) || dominantScript;

      let line = undefined;
      if (fm?.data?.lang) {
         line = fm.lineOf ? fm.lineOf(["lang"]) + fm.offset : undefined;
      }

      findings.push({
        in: "source",
        file,
        line,
        message: `page text script differs from its \`lang\`: dominant script is ${dominantName}`
      });
    }
  }

  return result(findings);
}
