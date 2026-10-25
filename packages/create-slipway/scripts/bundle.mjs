// Runs before `npm pack` and `npm publish`: copies the starter and the theme files from the
// repository into template/, so the published package needs nothing else. template/ is not committed.
import { rmSync } from "node:fs";
import { join } from "node:path";
import { copySources, packageRoot, repoSources } from "../src/sources.mjs";

const out = join(packageRoot, "template");
rmSync(out, { recursive: true, force: true });
copySources(repoSources(), out);
console.log(`bundled the starter into ${out}`);
