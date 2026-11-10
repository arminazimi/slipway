// Visual regression gate (issue #1155): screenshot four pages of `fixtures/docs-site` and one
// right-to-left page of `fixtures/rtl-site`, at three widths in light and dark, and compare each against
// the baseline committed beside this file. Each platform has its own baseline (`-darwin.png`,
// `-linux.png`), because text rasterization differs between systems; a platform without one prints SKIP.
//
//   node tools/visual/run.ts             compare the build with `tools/visual/baseline/`
//   node tools/visual/run.ts --update    rewrite the baseline from the current build
//   npm run check                        runs the gate with every other check
//
// The four pages are the ones the release is measured on: the home page, a guide, a reference page, and a
// rule page. The fifth is a right-to-left page, so a direction regression fails the gate too. Every shot is
// 375, 1024, and 1440 px wide in both themes, which is 30 images.
//
// The fixture build the gates share (issue #1146) does not link the theme's stylesheets yet: the engine's CSS
// bundler exists, but no output writes it to the page. The gate therefore serves `packages/theme` beside the
// build and adds the theme's stylesheets itself, in cascade order, when a page links none. That keeps the
// screenshots about the theme, which is what the baseline records; once the build links its own bundles the
// gate leaves the page alone. Fonts come from the same folder, so `document.fonts.ready` waits for the real
// faces rather than a fallback.
//
// Animations are disabled and transitions have no duration before a screenshot, so a moving element cannot
// make the gate flaky. The baseline changes only with `--update`; a pull request that runs it says so and
// attaches the new images, as every other gate's baseline does.
//
// The browser is optional, as in every gate that needs one: when Playwright or Chromium is missing the gate
// prints SKIP and exits 0. CI runs Node only today (`.github/workflows/ci.yml`); the browser job that
// `quality.ci` adds installs both.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";
import { builtSite, type FixtureName } from "../fixture-build/build.ts";

/** The repository root: this file sits three levels below it. */
export const root = join(fileURLToPath(import.meta.url), "../../..");

/** The theme's root folder: the stylesheets and fonts the gate loads beside a build. */
export const THEME_ROOT = join(root, "packages/theme");

/** The committed baseline every run is compared with. */
export const BASELINE_DIR = join(root, "tools/visual/baseline");

/** The platform the baseline is read from and written to: text rendering differs between systems. */
export const PLATFORM = process.platform;

/** The widths every page is shot at. */
export const WIDTHS = [375, 1024, 1440] as const;

/** The themes every page is shot in. */
export const THEMES = ["light", "dark"] as const;

/** One theme a page is shot in. */
export type Theme = (typeof THEMES)[number];

/** A width a page is shot at. */
export type Width = (typeof WIDTHS)[number];

/** One page the baseline covers. */
export interface Target {
  /** The name in the baseline file, such as `home`. */
  readonly name: string;
  /** The fixture this page belongs to. */
  readonly fixture: FixtureName;
  /** The build-relative URL, such as `/quickstart/`. */
  readonly url: string;
  /**
   * The direction the page should render in, when the build does not carry it itself. The RTL fixture
   * still has the old `slipway.yml` name and the engine reads `mizzen.yml`, so its pages come out LTR;
   * stating the direction here keeps the right-to-left shot about the layout, which is what the gate
   * measures. A build that sets the direction itself wins nothing: setting it again is the same value.
   */
  readonly dir?: "rtl";
}

/**
 * The five pages the baseline covers: the home page, a guide, a reference page, and a rule page from the
 * docs fixture, plus a right-to-left page from the RTL fixture.
 */
export const TARGETS: readonly Target[] = [
  { name: "home", fixture: "docs-site", url: "/" },
  { name: "guide", fixture: "docs-site", url: "/quickstart/" },
  { name: "reference", fixture: "docs-site", url: "/reference/" },
  { name: "rule", fixture: "docs-site", url: "/rules/hooks-033/" },
  { name: "rtl", fixture: "rtl-site", url: "/configuration/", dir: "rtl" },
];

/** One screenshot: a page, a width, and a theme. */
export interface Shot {
  /** The page it shows. */
  readonly target: Target;
  /** The viewport width. */
  readonly width: Width;
  /** The color scheme. */
  readonly theme: Theme;
  /** The baseline file's name, without `.png`. */
  readonly name: string;
}

/** The baseline file's name for a page, width, and theme. */
export function shotName(target: Target, width: Width, theme: Theme): string {
  return `${target.name}-${width}-${theme}`;
}

/**
 * The baseline file for a shot on a platform. Font rasterization and layout rounding differ between
 * systems, so each platform keeps its own committed images, as Playwright does. A new platform starts
 * with `--update`; until then the gate prints SKIP rather than comparing apples with oranges.
 */
export function fileName(shot: Shot, platform = PLATFORM): string {
  return `${shot.name}-${platform}.png`;
}

/** Every shot the gate takes and compares, in a stable order. */
export function shots(): Shot[] {
  const out: Shot[] = [];
  for (const target of TARGETS) {
    for (const width of WIDTHS) {
      for (const theme of THEMES) out.push({ target, width, theme, name: shotName(target, width, theme) });
    }
  }
  return out;
}

/** A decoded image: 8-bit RGB or RGBA rows, top to bottom. */
export interface Frame {
  /** Pixels across. */
  readonly width: number;
  /** Pixels down. */
  readonly height: number;
  /** 3 for RGB, 4 for RGBA. */
  readonly channels: 3 | 4;
  /** `width * height * channels` bytes. */
  readonly data: Uint8Array;
}

/** The PNG signature every file starts with. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

/** The IHDR fields the decoder understands: 8-bit, RGB or RGBA, not interlaced. */
interface Header {
  readonly width: number;
  readonly height: number;
  readonly channels: 3 | 4;
}

/** Reads the 13-byte IHDR payload, refusing the formats Chromium does not write. */
function readHeader(chunk: Uint8Array): Header {
  const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  const width = view.getUint32(0);
  const height = view.getUint32(4);
  const bitDepth = chunk[8];
  const colorType = chunk[9];
  const compression = chunk[10];
  const filter = chunk[11];
  const interlace = chunk[12];
  if (bitDepth !== 8) throw new Error(`visual: PNG bit depth ${bitDepth} is not supported; expected 8.`);
  if (colorType !== 2 && colorType !== 6) {
    throw new Error(`visual: PNG color type ${colorType} is not supported; expected 2 (RGB) or 6 (RGBA).`);
  }
  if (compression !== 0 || filter !== 0) throw new Error("visual: PNG uses an unknown compression or filter method.");
  if (interlace !== 0) throw new Error("visual: interlaced PNG is not supported.");
  return { width, height, channels: colorType === 2 ? 3 : 4 };
}

/** A row's previous pixel channel, as the PNG filters define it. */
function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

/** Undoes the per-row filters of a non-interlaced 8-bit PNG. */
function unfilter(raw: Uint8Array, header: Header): Uint8Array {
  const { width, height, channels } = header;
  const stride = width * channels;
  const out = new Uint8Array(stride * height);
  let source = 0;
  for (let y = 0; y < height; y++) {
    const type = raw[source++] ?? 0;
    const row = y * stride;
    const previous = row - stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? out[row + x - channels]! : 0;
      const up = y > 0 ? out[previous + x]! : 0;
      const corner = y > 0 && x >= channels ? out[previous + x - channels]! : 0;
      const value = raw[source++] ?? 0;
      out[row + x] =
        type === 0
          ? value
          : type === 1
            ? (value + left) & 0xff
            : type === 2
              ? (value + up) & 0xff
              : type === 3
                ? (value + ((left + up) >> 1)) & 0xff
                : type === 4
                  ? (value + paeth(left, up, corner)) & 0xff
                  : (() => {
                      throw new Error(`visual: PNG row filter ${type} is not supported.`);
                    })();
    }
  }
  return out;
}

/** Decodes the PNG screenshots Chromium writes: 8-bit RGB or RGBA, not interlaced. */
export function decodePng(buffer: Buffer): Frame {
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (buffer[i] !== PNG_SIGNATURE[i]) throw new Error("visual: not a PNG file.");
  }

  let offset = PNG_SIGNATURE.length;
  let header: Header | undefined;
  const data: Buffer[] = [];
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const start = offset + 8;
    const end = start + length;
    if (end + 4 > buffer.length) throw new Error(`visual: PNG chunk ${type} runs past the end of the file.`);
    if (type === "IHDR") header = readHeader(buffer.subarray(start, end));
    else if (type === "IDAT") data.push(buffer.subarray(start, end));
    else if (type === "IEND") break;
    offset = end + 4;
  }

  if (header === undefined) throw new Error("visual: PNG has no IHDR chunk.");
  if (data.length === 0) throw new Error("visual: PNG has no IDAT chunk.");
  const raw = inflateSync(Buffer.concat(data));
  const expected = header.height * (header.width * header.channels + 1);
  if (raw.length !== expected) throw new Error(`visual: PNG data is ${raw.length} bytes; expected ${expected}.`);
  return { ...header, data: unfilter(raw, header) };
}

/** The color difference between two pixels, in the YIQ space pixelmatch uses. */
function colorDelta(a: Frame, ai: number, b: Frame, bi: number): number {
  const dr = (a.data[ai] ?? 0) - (b.data[bi] ?? 0);
  const dg = (a.data[ai + 1] ?? 0) - (b.data[bi + 1] ?? 0);
  const db = (a.data[ai + 2] ?? 0) - (b.data[bi + 2] ?? 0);
  const y = dr * 0.29889531 + dg * 0.58662247 + db * 0.11448223;
  const i = dr * 0.59597799 - dg * 0.2741761 - db * 0.32180189;
  const q = dr * 0.21147017 - dg * 0.52261711 + db * 0.31114694;
  return 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
}

/** How different two pixels must be to count: 0.1 is the usual pixelmatch threshold. */
export const PIXEL_THRESHOLD = 0.1;

/** How many pixels may differ before the shot fails: one percent, as pixelmatch's default. */
export const MAX_DIFF_RATIO = 0.01;

/** What comparing two frames found. */
export interface FrameDiff {
  /** Pixels whose color differs by more than {@link PIXEL_THRESHOLD}. */
  readonly changed: number;
  /** Every pixel compared. */
  readonly total: number;
  /** `changed / total`, from 0 to 1. */
  readonly ratio: number;
}

/** Compares two frames of the same size; a different size is a failure, never a crop. */
export function diffFrames(expected: Frame, actual: Frame): FrameDiff {
  if (expected.width !== actual.width || expected.height !== actual.height) {
    throw new Error(
      `visual: image size changed from ${expected.width}×${expected.height} to ${actual.width}×${actual.height}.`,
    );
  }
  if (expected.channels !== actual.channels) {
    throw new Error(`visual: image channel count changed from ${expected.channels} to ${actual.channels}.`);
  }
  const limit = 35215 * PIXEL_THRESHOLD * PIXEL_THRESHOLD;
  const total = expected.width * expected.height;
  let changed = 0;
  for (let pixel = 0; pixel < total; pixel++) {
    const a = pixel * expected.channels;
    const b = pixel * actual.channels;
    if (colorDelta(expected, a, actual, b) > limit) changed++;
  }
  return { changed, total, ratio: total === 0 ? 0 : changed / total };
}

/** Compares two PNG buffers and returns their difference; a size change throws. */
export function comparePng(expected: Buffer, actual: Buffer): FrameDiff {
  return diffFrames(decodePng(expected), decodePng(actual));
}

/** What a capture returns: one PNG per shot, or why it could not run. */
export type CaptureResult = { readonly images: ReadonlyMap<string, Buffer> } | { readonly skip: string };

/** What a capture needs: the shots and the build folder of each fixture it uses. */
export interface CaptureRequest {
  /** The shots to take. */
  readonly shots: readonly Shot[];
  /** A build folder per fixture. */
  readonly roots: Readonly<Partial<Record<FixtureName, string>>>;
  /** The theme's root folder; defaults to {@link THEME_ROOT}. */
  readonly themeRoot?: string;
}

/** Takes the screenshots; tests replace it with a fake. */
export type Capturer = (request: CaptureRequest) => Promise<CaptureResult>;

/** MIME types a built site and the theme serve. */
const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

/** The theme paths a page needs: fonts, tokens, base, layouts, chrome, and components, in cascade order. */
export function themeStylesheets(themeRoot = THEME_ROOT): string[] {
  const css = (rel: string): string | undefined => (existsSync(join(themeRoot, rel)) ? rel : undefined);
  const folders = ["chrome", "components"].flatMap((folder) => {
    const dir = join(themeRoot, folder);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, "style.css")))
      .map((entry) => `${folder}/${entry.name}/style.css`)
      .sort(byCodePoint);
  });
  return [
    "styles/fonts.css",
    "styles/tokens.css",
    "styles/base.css",
    ...readdirSync(join(themeRoot, "layouts"))
      .filter((file) => file.endsWith(".css"))
      .sort(byCodePoint)
      .map((file) => `layouts/${file}`),
    ...folders,
  ].flatMap((rel) => css(rel) ?? []);
}

/** Compares by code point, never by locale (ADR 0022, rule 5). */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Serves a build folder, plus the theme under `/__theme/`, so root-relative URLs and fonts work. */
async function serve(buildDir: string, themeRoot: string): Promise<{ server: Server; origin: string }> {
  const site = resolve(buildDir);
  const theme = resolve(themeRoot);
  const handler = (request: IncomingMessage, response: ServerResponse): void => {
    let path: string;
    try {
      path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    } catch {
      response.statusCode = 400;
      response.end("bad request");
      return;
    }

    const themed = path.startsWith("/__theme/");
    const base = themed ? theme : site;
    const relative = themed ? path.slice("/__theme".length) : path;
    let file = resolve(base, `.${relative}`);
    if (file !== base && !file.startsWith(`${base}${sep}`)) {
      response.statusCode = 403;
      response.end("forbidden");
      return;
    }
    if (relative.endsWith("/")) file = join(file, "index.html");

    try {
      if (!statSync(file).isFile()) throw new Error("not a file");
      response.setHeader("content-type", CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream");
      const bytes = readFileSync(file);
      // The theme loads its Latin fonts with `font-display: optional`, so a font that misses the first paint is never used.
      // A baseline shows the page with its fonts, so the gate serves them as `block`: the shot no longer depends on timing.
      response.end(extname(file).toLowerCase() === ".css" ? bytes.toString("utf8").replace(/font-display:\s*optional/g, "font-display:block") : bytes);
    } catch {
      response.statusCode = 404;
      try {
        response.setHeader("content-type", CONTENT_TYPES[".html"]!);
        response.end(readFileSync(join(site, "404.html")));
      } catch {
        response.end("not found");
      }
    }
  };

  const server = createServer(handler);
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  return { server, origin: `http://127.0.0.1:${port}` };
}

/** The first Chromium that exists: the one the environment names, else the system browser. */
export function chromiumPath(): string | undefined {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    process.env.CHROME,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ];
  return candidates.find((candidate): candidate is string => typeof candidate === "string" && existsSync(candidate));
}

/**
 * The browser to shoot with: an explicit override, then the Chromium Playwright installed (pinned by the
 * lockfile, so a browser update does not quietly rebaseline every page), then the system browser.
 */
function browserExecutable(chromium: typeof import("playwright-core").chromium): string | undefined {
  for (const candidate of [process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, process.env.CHROME]) {
    if (typeof candidate === "string" && existsSync(candidate)) return candidate;
  }
  try {
    const bundled = chromium.executablePath();
    if (existsSync(bundled)) return bundled;
  } catch {
    // No browser installed by Playwright either.
  }
  return chromiumPath();
}

/** True when a Chromium the gate can launch is installed. Tests use it to skip the browser pass. */
export async function browserAvailable(): Promise<boolean> {
  try {
    const { chromium } = await import("playwright-core");
    return browserExecutable(chromium) !== undefined;
  } catch {
    return false;
  }
}

/** CSS that stops motion and hides the text caret, so two runs of the same page look the same. */
const STILL = `*,*::before,*::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  scroll-behavior: auto !important;
  caret-color: transparent !important;
}`;

/** Takes every shot in a real browser. */
export async function capture(request: CaptureRequest): Promise<CaptureResult> {
  let chromium: typeof import("playwright-core").chromium;
  try {
    ({ chromium } = await import("playwright-core"));
  } catch {
    return { skip: "playwright-core is not installed (run npm ci)." };
  }

  let executablePath = browserExecutable(chromium);
  if (executablePath === undefined) {
    return { skip: "no Chromium found; set CHROME or run `npx playwright install chromium`." };
  }

  const themeRoot = request.themeRoot ?? THEME_ROOT;
  const fixtures = [...new Set(request.shots.map((shot) => shot.target.fixture))].sort(byCodePoint);
  const missing = fixtures.find((fixture) => request.roots[fixture] === undefined);
  if (missing !== undefined) return { skip: `no build folder for ${missing}.` };
  const servers = new Map<FixtureName, { server: Server; origin: string }>();
  for (const fixture of fixtures) servers.set(fixture, await serve(request.roots[fixture]!, themeRoot));

  let browser: Awaited<ReturnType<typeof chromium.launch>>;
  try {
    browser = await chromium.launch({ executablePath, headless: true });
  } catch (err) {
    for (const { server } of servers.values()) server.close();
    throw err;
  }

  const styles = themeStylesheets(themeRoot);
  const contexts = new Map<string, Awaited<ReturnType<typeof browser.newContext>>>();
  const images = new Map<string, Buffer>();
  try {
    for (const shot of request.shots) {
      const { origin } = servers.get(shot.target.fixture)!;
      const key = `${shot.width}-${shot.theme}`;
      let context = contexts.get(key);
      if (context === undefined) {
        context = await browser.newContext({
          colorScheme: shot.theme,
          viewport: { width: shot.width, height: 900 },
          deviceScaleFactor: 1,
          reducedMotion: "reduce",
        });
        contexts.set(key, context);
      }

      const page = await context.newPage();
      try {
        await page.goto(`${origin}${shot.target.url}`, { waitUntil: "load" });
        await page.emulateMedia({ colorScheme: shot.theme, reducedMotion: "reduce" });
        await page.evaluate((theme) => document.documentElement.setAttribute("data-theme", theme), shot.theme);
        if (shot.target.dir !== undefined) {
          await page.evaluate((dir) => document.documentElement.setAttribute("dir", dir), shot.target.dir);
        }

        // The build links no theme stylesheet yet; load the theme itself, as the page would in production.
        const linked = await page.evaluate(() => document.querySelector('link[rel="stylesheet"]') !== null);
        if (!linked) {
          for (const rel of styles) await page.addStyleTag({ url: `${origin}/__theme/${rel}` });
        }
        await page.addStyleTag({ content: STILL });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(
            [...document.images]
              .filter((image) => !image.complete)
              .map((image) => new Promise((done) => {
                image.addEventListener("load", done, { once: true });
                image.addEventListener("error", done, { once: true });
              })),
          );
        });
        images.set(
          shot.name,
          await page.screenshot({ fullPage: true, type: "png", animations: "disabled", caret: "hide" }),
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    for (const context of contexts.values()) await context.close();
    await browser.close();
    for (const { server } of servers.values()) await new Promise<void>((done) => server.close(() => done()));
  }

  return { images };
}

/** What {@link run} found for one shot. */
export interface ShotResult {
  /** The shot's baseline name. */
  readonly shot: string;
  /** True when the image matches the baseline within the tolerance. */
  readonly ok: boolean;
  /** The share of pixels that differ, when both images could be read. */
  readonly ratio?: number;
  /** Why the shot failed, in one line. */
  readonly reason?: string;
}

/** Where {@link run} reads and writes, and what it runs. Tests set every field. */
export interface RunOptions {
  /** The baseline folder. Default: {@link BASELINE_DIR}. */
  readonly baselineDir?: string;
  /** Folder per fixture, when the caller already built them. */
  readonly roots?: Readonly<Partial<Record<FixtureName, string>>>;
  /** The shots to take; defaults to {@link shots}. */
  readonly shots?: readonly Shot[];
  /** Takes the screenshots; defaults to {@link capture}. */
  readonly capture?: Capturer;
  /** Rewrite the baseline instead of comparing. Default: false. */
  readonly update?: boolean;
  /** Where a normal line goes. Default: `console.log`. */
  readonly log?: (line: string) => void;
  /** Where a failure goes. Default: `console.error`. */
  readonly error?: (line: string) => void;
}

/** The fixture names {@link TARGETS} uses, so a run builds only what it needs. */
function fixturesOf(selected: readonly Shot[]): FixtureName[] {
  return [...new Set(selected.map((shot) => shot.target.fixture))].sort(byCodePoint);
}

/** Builds the fixtures a run needs, or uses the caller's folders. */
async function rootsOf(selected: readonly Shot[], given: RunOptions["roots"]): Promise<Record<FixtureName, string>> {
  const roots: Partial<Record<FixtureName, string>> = { ...given };
  for (const fixture of fixturesOf(selected)) {
    if (roots[fixture] === undefined) roots[fixture] = await builtSite(fixture);
  }
  return roots as Record<FixtureName, string>;
}

/** Runs the gate: take the shots, then update or compare the baseline. Returns the exit code. */
export async function run(options: RunOptions = {}): Promise<number> {
  const log = options.log ?? console.log;
  const error = options.error ?? console.error;
  const baselineDir = resolve(options.baselineDir ?? BASELINE_DIR);
  const selected = options.shots ?? shots();
  const take = options.capture ?? capture;

  if (options.update !== true && !selected.some((shot) => existsSync(join(baselineDir, fileName(shot))))) {
    log(
      `SKIP: visual: no ${PLATFORM} baseline in ${baselineDir}; ` +
        "run `node tools/visual/run.ts --update` on this platform and commit the images.",
    );
    return 0;
  }

  let roots: Record<FixtureName, string>;
  try {
    roots = await rootsOf(selected, options.roots);
  } catch (err) {
    error(`FAIL: visual: the fixture did not build: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  let captured: CaptureResult;
  try {
    captured = await take({ shots: selected, roots });
  } catch (err) {
    error(`FAIL: visual: the screenshots could not be taken: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }
  if ("skip" in captured) {
    log(`SKIP: visual: ${captured.skip}`);
    return 0;
  }

  if (options.update === true) {
    for (const shot of selected) {
      if (captured.images.get(shot.name) === undefined) {
        error(`FAIL: visual: no screenshot for ${shot.name}.`);
        return 1;
      }
    }
    await mkdir(baselineDir, { recursive: true });
    let written = 0;
    for (const shot of selected) {
      const image = captured.images.get(shot.name)!;
      await writeFile(join(baselineDir, fileName(shot)), image);
      written++;
    }
    log(`OK: visual: wrote ${written} baseline image(s) for ${PLATFORM} to ${baselineDir}. Commit them with the pull request.`);
    return 0;
  }

  const results: ShotResult[] = [];
  for (const shot of selected) {
    const file = join(baselineDir, fileName(shot));
    let expected: Buffer;
    try {
      expected = await readFile(file);
    } catch {
      results.push({
        shot: shot.name,
        ok: false,
        reason: `no ${PLATFORM} baseline at ${file}; run \`node tools/visual/run.ts --update\` and commit it`,
      });
      continue;
    }
    const actual = captured.images.get(shot.name);
    if (actual === undefined) {
      results.push({ shot: shot.name, ok: false, reason: "no screenshot for this shot" });
      continue;
    }
    try {
      const diff = comparePng(expected, actual);
      const ok = diff.ratio <= MAX_DIFF_RATIO;
      results.push({
        shot: shot.name,
        ok,
        ratio: diff.ratio,
        ...(ok ? {} : { reason: `${diff.changed} of ${diff.total} pixels differ (${(diff.ratio * 100).toFixed(2)}%)` }),
      });
    } catch (err) {
      results.push({ shot: shot.name, ok: false, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  const failed = results.filter((result) => !result.ok);
  for (const result of failed) error(`FAIL: visual ${result.shot}: ${result.reason ?? "differs from the baseline"}`);
  if (failed.length > 0) {
    error(
      `FAIL: visual: ${failed.length} of ${results.length} screenshot(s) differ. ` +
        "If the change is intended, run `node tools/visual/run.ts --update`, say so in the pull request, and attach the new images.",
    );
    return 1;
  }

  const suffix = `-${PLATFORM}.png`;
  const stale = existsSync(baselineDir)
    ? (await readdir(baselineDir)).filter(
        (file) => file.endsWith(suffix) && !selected.some((shot) => fileName(shot) === file),
      )
    : [];
  if (stale.length > 0) log(`note: visual: ${stale.length} baseline image(s) are not part of this run (${stale.join(", ")}).`);
  log(`OK: visual (${results.length} screenshots: ${TARGETS.length} pages, ${WIDTHS.length} widths, ${THEMES.length} themes)`);
  return 0;
}

/** Reads `--update` and runs the gate; the tool's entry point. */
export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  return run({ update: argv.includes("--update") });
}

const invoked = process.argv[1];
if (invoked !== undefined && import.meta.url === pathToFileURL(resolve(invoked)).href) {
  main().then((code) => {
    process.exitCode = code;
  });
}
