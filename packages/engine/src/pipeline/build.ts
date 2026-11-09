import { access, mkdir, mkdtemp, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { discover } from "../content/discover.ts";
import type { Diagnostic, Head, Output, OutputContext, OutputFile, Page, Pager, Site, Trail } from "../contracts/index.ts";
import { buildModel } from "../model/build.ts";
import { navState } from "../nav/tree.ts";
import { MANIFEST_PATH, recordBuildHash } from "../outputs/build-hash.ts";
import { loadRegistry, type ThemeRegistry } from "../render/registry.ts";
import { renderPage, type ThemeComponent } from "../render/render.ts";
import { copyAssets } from "./assets.ts";
import { createDiagnostics, sortDiagnostics, type Diagnostics } from "./diagnostics.ts";

/** Options of {@link build}. */
export interface BuildOptions {
  /** The site root: the folder that holds `mizzen.yml`. */
  readonly root: string;
  /** The folder the site is written to. Replaced as a whole: the old site stays until the new one is complete. */
  readonly out: string;
  /** The theme's root folder: its `src/index.ts`, and its `layouts/`, `chrome/`, and `components/` folders. */
  readonly themeRoot: string;
  /** Theme files to copy, as paths relative to `themeRoot`; each lands under `assets/theme/` with its hash in the name. */
  readonly themeFiles?: readonly string[];
  /** Layout for a page that names none in its front matter or in `defaults`. Without it such a page is an error. */
  readonly defaultLayout?: string;
  /** Folder the outputs are read from. Default: `src/outputs/` beside this file. */
  readonly outputsDir?: string;
}

/** What {@link build} wrote and found. */
export interface BuildResult {
  /** Absolute path of the output folder. */
  readonly out: string;
  /** Every file written, relative to `out`, sorted by path. */
  readonly files: readonly string[];
  /** Every finding of the build, sorted. The site is written even when there are errors; the caller decides whether to fail. */
  readonly diagnostics: readonly Diagnostic[];
}

/** The default folder of outputs: `src/outputs/` beside this file's folder. */
const OUTPUTS_DIR = fileURLToPath(new URL("../outputs/", import.meta.url));

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** True for a path an output may write: relative, `/`-separated, and with no empty, `.`, or `..` segment. */
function isInside(path: string): boolean {
  if (path === "" || path.startsWith("/") || path.includes("\\") || /^[A-Za-z]:/.test(path)) return false;
  return path.split("/").every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function isOutput(value: unknown): value is Output {
  if (typeof value !== "object" || value === null) return false;
  const { name, run } = value as { name?: unknown; run?: unknown };
  return typeof name === "string" && typeof run === "function";
}

/**
 * Reads every `*.ts` file of the outputs folder in file-name order and returns the outputs they export.
 * A file must export exactly one output, under any export name, and the output's `name` must equal the file name.
 * A file that exports no output is a helper and is not run.
 */
async function loadOutputs(dir: string, diagnostics: Diagnostics): Promise<Output[]> {
  if (!(await exists(dir))) {
    diagnostics.error("output.missing-folder", `Output folder "${dir}" does not exist.`, {
      help: "Point `outputsDir` at the folder of output files.",
    });
    return [];
  }
  const names = (await readdir(dir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort(byCodePoint);

  const outputs: Output[] = [];
  for (const file of names) {
    let mod: Record<string, unknown>;
    try {
      mod = (await import(pathToFileURL(join(dir, file)).href)) as Record<string, unknown>;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      diagnostics.error("output.load-failed", `Failed to load output "${file}": ${detail}.`, {
        help: "Fix the file so Node can import it.",
      });
      continue;
    }
    const found = Object.keys(mod)
      .sort(byCodePoint)
      .map((key) => mod[key])
      .filter(isOutput);
    if (found.length === 0) continue;
    if (found.length > 1) {
      diagnostics.error("output.multiple", `Output file "${file}" exports ${found.length} outputs; it may export one.`, {
        help: "Move the extra outputs into their own files.",
      });
      continue;
    }
    const output = found[0]!;
    const expected = file.slice(0, -".ts".length);
    if (output.name !== expected) {
      diagnostics.error("output.name-mismatch", `Output file "${file}" is named "${output.name}"; it must be "${expected}".`, {
        help: "Make the output's name equal to its file name, without `.ts`.",
      });
      continue;
    }
    outputs.push(output);
  }
  return outputs;
}

/** The theme's components by name, as the render host takes them. Islands are not wired yet. */
function componentsOf(registry: ThemeRegistry): Record<string, ThemeComponent> {
  const out: Record<string, ThemeComponent> = {};
  for (const [name, unit] of Object.entries(registry.components)) {
    out[name] = unit.css === undefined ? { component: unit.component } : { component: unit.component, css: unit.css };
  }
  return out;
}

/** The navigation list the page sits in, with its breadcrumb and pager. Lists are tried in name order. */
function placeOf(site: Site, page: Page): { trail: Trail; pager: Pager } {
  for (const name of Object.keys(site.nav).sort(byCodePoint)) {
    const state = navState(site.nav[name] ?? [], page.url);
    if (state.current !== undefined || state.active !== undefined) return { trail: state.trail, pager: state.pager };
  }
  return { trail: [], pager: {} };
}

/** The head of a page: its title and, when it has one, its description. */
function headOf(page: Page): Head {
  const description = page.frontMatter.description;
  return {
    title: page.title,
    meta: typeof description === "string" ? [{ name: "description", content: description }] : [],
    links: [],
    jsonLd: [],
  };
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** What a page that cannot be laid out is written as: its own body, so the file exists and the build reports the error. */
function fallbackHtml(page: Page): string {
  return `<!DOCTYPE html>\n<html lang="${escapeText(page.lang)}" dir="${escapeText(page.dir)}">\n<head><meta charset="utf-8"><title>${escapeText(page.title)}</title></head>\n<body>\n${page.html}\n</body>\n</html>\n`;
}

/**
 * Puts `staging` in place of `out`. The old folder is moved aside first and removed only once the new one is in
 * place, so a failed swap puts the old site back.
 */
async function commit(staging: string, out: string): Promise<void> {
  const replaced = `${staging}-replaced`;
  const hadOld = await exists(out);
  if (hadOld) await rename(out, replaced);
  try {
    await rename(staging, out);
  } catch (err) {
    if (hadOld) await rename(replaced, out);
    throw err;
  }
  if (hadOld) await rm(replaced, { recursive: true, force: true });
}

/**
 * Builds the site: model, theme, outputs, and write.
 *
 * Every output runs first, in file-name order, and its files are checked in memory: a path outside the output folder
 * is an error, and so is a path two outputs both write; the first one wins. Then the site's assets are copied and the
 * output files written, all into a staging folder beside `out`. A site file wins over an output file at the same path:
 * the output's file is skipped, with no diagnostic. Only when the staging folder is complete is it swapped in, so `out`
 * is never half-written. Outputs switched off by `outputs` in the config do not run.
 *
 * Problems in the content and the theme come back as diagnostics; a throw means a bug, such as an output or layout
 * that threw, and leaves `out` as it was. `out` must not be the source folder nor sit inside it, unless its name
 * starts with `_` or `.`, which discovery skips.
 */
export async function build(options: BuildOptions): Promise<BuildResult> {
  const diagnostics = createDiagnostics();
  const root = resolve(options.root);
  const out = resolve(options.out);
  const themeRoot = resolve(options.themeRoot);

  const model = await buildModel(root);
  for (const d of model.diagnostics) diagnostics.report(d);
  const { site } = model;

  const sourceDir = resolve(root, site.config.source);
  const rel = relative(sourceDir, out);
  const inside = rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
  if (inside && (rel === "" || !/^[_.]/.test(rel.split(sep)[0] ?? ""))) {
    throw new TypeError(
      `build: the output folder "${out}" is inside the source folder "${sourceDir}"; name it with a leading "_" (such as _site) or put it outside.`,
    );
  }

  const registry = await loadRegistry(themeRoot);
  for (const d of registry.diagnostics) diagnostics.report(d);
  const components = componentsOf(registry);

  const renderOne = (page: Page): string => {
    const name = page.frontMatter.layout ?? options.defaultLayout;
    if (name === undefined) {
      diagnostics.error("render.no-layout", `Page ${page.url} has no layout.`, {
        pos: page.source,
        help: "Set `layout` in its front matter or in `defaults`.",
      });
      return fallbackHtml(page);
    }
    if (!Object.hasOwn(registry.layouts, name)) {
      diagnostics.error("render.unknown-layout", `Page ${page.url} names the layout "${name}", which the theme does not have.`, {
        pos: page.source,
        help: "Use a layout from the theme's layouts/ folder.",
      });
      return fallbackHtml(page);
    }
    const { trail, pager } = placeOf(site, page);
    const result = renderPage({
      site,
      page,
      layout: registry.layouts[name]!.layout,
      components,
      trail,
      pager,
      head: headOf(page),
    });
    for (const d of result.diagnostics) diagnostics.report(d);
    return result.html;
  };

  const ctx: OutputContext = {
    renderPage: (page) => Promise.resolve(renderOne(page)),
    report: (d) => diagnostics.report(d),
  };

  const files = await discover(sourceDir, { include: site.config.include, exclude: site.config.exclude });

  // Outputs run in memory, so every path is checked before anything is written.
  const claimed = new Map<string, string>();
  const pending: { readonly output: string; readonly file: OutputFile }[] = [];
  for (const output of await loadOutputs(options.outputsDir ?? OUTPUTS_DIR, diagnostics)) {
    if (site.config.outputs[output.name] === false) continue;
    for (const file of await output.run(site, ctx)) {
      if (!isInside(file.path)) {
        diagnostics.error("output.bad-path", `Output "${output.name}" writes "${file.path}", which is not inside the output folder.`, {
          help: "Use a relative path with `/` separators and no `..`.",
        });
        continue;
      }
      const first = claimed.get(file.path);
      if (first !== undefined) {
        diagnostics.error("output.duplicate-path", `Two files write "${file.path}": outputs "${first}" and "${output.name}".`, {
          help: "Turn one of them off in `outputs`, or rename its file.",
        });
        continue;
      }
      claimed.set(file.path, output.name);
      pending.push({ output: output.name, file });
    }
  }

  const parent = dirname(out);
  await mkdir(parent, { recursive: true });
  const staging = await mkdtemp(join(parent, `.${basename(out)}-build-`));
  try {
    const assets = await copyAssets({
      source: sourceDir,
      out: staging,
      files,
      themeRoot,
      themeFiles: options.themeFiles ?? [],
    });
    const assetPaths = new Set(assets.files.map((f) => f.path));
    const written = assets.files.map((f) => f.path);

    for (const { output, file } of pending) {
      // A site's own file wins over a generated one at the same path, silently: a site `llms.txt` replaces the output's.
      if (assetPaths.has(file.path)) continue;
      const abs = join(staging, file.path);
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, file.contents);
      written.push(file.path);
    }

    // The build's one hash goes into the manifest last, so every other file is in place (#1252). The manifest that
    // records the hash is left out of it, and a site file that replaced the generated manifest is left alone.
    if (claimed.get(MANIFEST_PATH) === "manifest" && !assetPaths.has(MANIFEST_PATH)) await recordBuildHash(staging);

    await commit(staging, out);
    return {
      out,
      files: [...written].sort(byCodePoint),
      diagnostics: sortDiagnostics(diagnostics.all),
    };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
