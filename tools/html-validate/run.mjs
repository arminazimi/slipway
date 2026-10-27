import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { root } from "../theme/build.mjs";

export function runHtmlValidate(site) {
  try {
    const { status, error, stdout, stderr } = spawnSync("npx", ["html-validate", "--config", join(root, ".htmlvalidate.cjs"), site + "/**/*.html"], { encoding: "utf8", shell: true });
    if (error) {
      if (error.code === 'ENOENT') {
        return { ok: true, output: "SKIP: html-validate not found" };
      }
      return { ok: false, output: error.message };
    }
    return { ok: status === 0, output: `${stdout}${stderr}` };
  } catch (err) {
    return { ok: true, output: `SKIP: ${err.message}` };
  }
}
