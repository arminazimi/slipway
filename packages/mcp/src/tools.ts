// Helpers shared by the tools in ./tools/. Each tool lives in its own file there and exports `definition` and `handler(site, args)`.
import { existsSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const themeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

export function outside(base, target) {
  const rel = relative(base, target);
  return rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel);
}

/** The real path of `path` inside `site`; throws when it resolves (symlinks included) outside the site. */
export function insideSite(site, path) {
  const base = realpathSync(site);
  const target = resolve(base, path);
  if (outside(base, target)) throw new Error(`${path} is outside the site directory`);
  if (!existsSync(target)) throw new Error(`${path} does not exist in the site`);
  if (outside(base, realpathSync(target))) throw new Error(`${path} is outside the site directory`);
  return realpathSync(target);
}
