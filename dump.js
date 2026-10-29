import { buildExample } from "./tools/theme/build.mjs";
import { join } from "node:path";
import { root } from "./tools/theme/tokens.mjs";
import { readFileSync } from "node:fs";

const outDir = join(root, ".tmp/blocks-ref-out");
const testSite = join(root, "site");

buildExample("template", outDir, testSite);
const html = readFileSync(join(outDir, "blocks/index.html"), "utf8");
console.log(html.substring(html.indexOf('Badge'), html.indexOf('Badge') + 500));
