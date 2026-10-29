import { buildExample } from "./tools/theme/build.mjs";
import { join } from "node:path";
import { root } from "./tools/theme/tokens.mjs";
import { readFileSync } from "node:fs";

try {
  buildExample("template", join(root, ".tmp/blocks-ref-out"), join(root, "site"));
  const html = readFileSync(join(root, ".tmp/blocks-ref-out/blocks/index.html"), "utf8");
  console.log(html.substring(html.indexOf('Badge'), html.indexOf('Badge') + 500));
} catch(e) {
  console.error("build error", e);
}
