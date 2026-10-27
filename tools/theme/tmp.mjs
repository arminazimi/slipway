import { join } from "node:path";
import { rmSync, mkdirSync } from "node:fs";
import { root } from "./tokens.mjs";

export function tmpDir(name) {
    const dir = join(root, `.tmp/${name}`);
    mkdirSync(join(root, '.tmp'), { recursive: true });
    rmSync(dir, { recursive: true, force: true });
    return dir;
}
