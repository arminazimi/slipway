import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { cp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import { builtSite } from "../fixture-build/build.ts";
import {
  BASELINE_DIR,
  browserAvailable,
  capture,
  comparePng,
  decodePng,
  diffFrames,
  fileName,
  MAX_DIFF_RATIO,
  PIXEL_THRESHOLD,
  PLATFORM,
  run,
  shotName,
  shots,
  TARGETS,
  THEMES,
  themeStylesheets,
  WIDTHS,
  type CaptureResult,
  type Capturer,
  type Frame,
} from "./run.ts";

/** A CRC table for the small PNG encoder below, which only exists so tests need no image library. */
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

/** The CRC of a chunk's type and data, as PNG defines it. */
function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buffer) c = (CRC[(c ^ byte) & 0xff]! ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

/** One PNG chunk: length, type, data, and CRC. */
function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, crc]);
}

/** A solid RGB PNG, so a test can make two images differ without an image library. */
function solidPng(width: number, height: number, red: number, green: number, blue: number): Buffer {
  const raw = Buffer.alloc(height * (width * 3 + 1));
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const at = row + 1 + x * 3;
      raw[at] = red;
      raw[at + 1] = green;
      raw[at + 2] = blue;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** A fake capture that returns one image per selected shot. */
function fixed(images: ReadonlyMap<string, Buffer> | ((name: string) => Buffer)): Capturer {
  return async ({ shots: selected }): Promise<CaptureResult> => {
    const made = new Map<string, Buffer>();
    for (const shot of selected) {
      const image = typeof images === "function" ? images(shot.name) : images.get(shot.name);
      if (image === undefined) throw new Error(`no image for ${shot.name}`);
      made.set(shot.name, image);
    }
    return { images: made };
  };
}

/** A temporary folder the test removes afterwards. */
function temp(t: { after: (fn: () => void) => void }, prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("the baseline covers four docs pages and one right-to-left page at three widths in both themes", () => {
  const all = shots();
  assert.equal(TARGETS.length, 5);
  assert.deepEqual(
    TARGETS.map((target) => `${target.name}:${target.fixture}:${target.url}`),
    [
      "home:docs-site:/",
      "guide:docs-site:/quickstart/",
      "reference:docs-site:/reference/",
      "rule:docs-site:/rules/hooks-033/",
      "rtl:rtl-site:/configuration/",
    ],
  );
  assert.deepEqual([...WIDTHS], [375, 1024, 1440]);
  assert.deepEqual([...THEMES], ["light", "dark"]);
  assert.equal(all.length, 5 * 3 * 2);
  assert.equal(all[0]?.name, "home-375-light");
  assert.equal(all.at(-1)?.name, "rtl-1440-dark");
  assert.equal(TARGETS.at(-1)?.dir, "rtl", "the right-to-left page is shot in RTL");
  assert.equal(shotName(TARGETS[0]!, 1024, "dark"), "home-1024-dark");
  assert.equal(fileName(all[0]!), `home-375-light-${PLATFORM}.png`);
});

test("the theme stylesheets load in cascade order", () => {
  const styles = themeStylesheets();
  assert.deepEqual(styles.slice(0, 3), ["styles/fonts.css", "styles/tokens.css", "styles/base.css"]);
  assert.ok(styles.includes("layouts/doc.css"));
  assert.ok(styles.includes("chrome/sidebar/style.css"));
  assert.ok(styles.includes("components/code/style.css"));
  assert.equal(new Set(styles).size, styles.length, "no stylesheet is loaded twice");
});

test("decodePng reads the RGB images Chromium writes", () => {
  const frame = decodePng(solidPng(3, 2, 10, 20, 30));
  assert.equal(frame.width, 3);
  assert.equal(frame.height, 2);
  assert.equal(frame.channels, 3);
  assert.deepEqual([...frame.data.slice(0, 3)], [10, 20, 30]);
});

test("diffFrames counts a pixel only when its color changes enough", () => {
  const base: Frame = { width: 2, height: 2, channels: 3, data: new Uint8Array(12).fill(100) };
  const same: Frame = { width: 2, height: 2, channels: 3, data: new Uint8Array(12).fill(100) };
  const changed: Frame = { width: 2, height: 2, channels: 3, data: new Uint8Array(12).fill(0) };
  assert.equal(diffFrames(base, same).ratio, 0);
  assert.equal(diffFrames(base, changed).ratio, 1);
  const nearly: Frame = { width: 2, height: 2, channels: 3, data: new Uint8Array(12).fill(103) };
  assert.equal(diffFrames(base, nearly).ratio, 0, "a difference under the threshold is not a change");
  assert.ok(PIXEL_THRESHOLD > 0 && MAX_DIFF_RATIO > 0);
  assert.throws(() => diffFrames(base, { ...same, width: 3 }), /size changed/);
});

test("comparePng compares the images a capture returns", () => {
  const expected = solidPng(10, 10, 255, 255, 255);
  assert.equal(comparePng(expected, expected).ratio, 0);
  assert.equal(comparePng(expected, solidPng(10, 10, 0, 0, 0)).ratio, 1);
});

test("--update writes the baseline and the next run passes", async (t) => {
  const baselineDir = temp(t, "visual-baseline-");
  const roots = { "docs-site": baselineDir, "rtl-site": baselineDir };
  const image = solidPng(20, 20, 12, 34, 56);
  const log: string[] = [];
  const error: string[] = [];

  assert.equal(await run({ baselineDir, roots, capture: fixed(() => image), update: true, log: (l) => log.push(l), error: (e) => error.push(e) }), 0);
  assert.equal(readFileSync(join(baselineDir, fileName(shots()[0]!))).length, image.length);
  assert.match(log.join("\n"), /wrote 30 baseline image/);

  assert.equal(await run({ baselineDir, roots, capture: fixed(() => image), log: (l) => log.push(l), error: (e) => error.push(e) }), 0);
  assert.deepEqual(error, []);
  assert.match(log.join("\n"), /OK: visual \(30 screenshots/);
});

test("a broken copy fails the gate and names the screenshot", async (t) => {
  const baselineDir = temp(t, "visual-baseline-");
  const roots = { "docs-site": baselineDir, "rtl-site": baselineDir };
  const good = solidPng(20, 20, 12, 34, 56);
  const error: string[] = [];
  await run({ baselineDir, roots, capture: fixed(() => good), update: true, log: () => {}, error: () => {} });

  const broken = (name: string): Buffer => (name === "guide-1024-dark" ? solidPng(20, 20, 200, 10, 10) : good);
  const code = await run({ baselineDir, roots, capture: fixed(broken), log: () => {}, error: (e) => error.push(e) });
  assert.equal(code, 1);
  assert.match(error.join("\n"), /FAIL: visual guide-1024-dark/);
  assert.match(error.join("\n"), /--update/);
});

test("a platform with no baseline skips instead of failing", async (t) => {
  const baselineDir = temp(t, "visual-empty-");
  const roots = { "docs-site": baselineDir, "rtl-site": baselineDir };
  const log: string[] = [];
  const code = await run({ baselineDir, roots, capture: fixed(() => solidPng(4, 4, 0, 0, 0)), log: (l) => log.push(l), error: () => {} });
  assert.equal(code, 0);
  assert.match(log.join("\n"), new RegExp(`SKIP: visual: no ${PLATFORM} baseline`));
});

test("a missing image in a platform's baseline fails with the command that writes it", async (t) => {
  const baselineDir = temp(t, "visual-partial-");
  const roots = { "docs-site": baselineDir, "rtl-site": baselineDir };
  const all = shots();
  const image = solidPng(4, 4, 0, 0, 0);
  await run({ baselineDir, roots, shots: all.slice(0, 1), capture: fixed(() => image), update: true, log: () => {}, error: () => {} });
  assert.ok(existsSync(join(baselineDir, fileName(all[0]!))));

  const error: string[] = [];
  const code = await run({ baselineDir, roots, shots: all.slice(0, 2), capture: fixed(() => image), log: () => {}, error: (e) => error.push(e) });
  assert.equal(code, 1);
  assert.match(error.join("\n"), /tools\/visual\/run\.ts --update/);
});

const baseline = join(BASELINE_DIR, fileName(shots().find((shot) => shot.name === "guide-375-light")!));
const browserSkip = !existsSync(baseline)
  ? `the committed ${PLATFORM} baseline is missing; run \`node tools/visual/run.ts --update\``
  : (await browserAvailable())
    ? false
    : "no Chromium found; set CHROME or run `npx playwright install chromium`";

test("the fixture passes against the committed baseline", { skip: browserSkip }, async () => {
  const selected = shots().filter((shot) => shot.name === "guide-375-light");
  const code = await run({ shots: selected, capture, log: () => {}, error: () => {} });
  assert.equal(code, 0);
});

test("a deliberately broken build copy fails against the committed baseline", { skip: browserSkip }, async (t) => {
  const docs = await builtSite("docs-site");
  const rtl = await builtSite("rtl-site");
  const copy = temp(t, "visual-broken-");
  await cp(docs, copy, { recursive: true });
  const page = join(copy, "quickstart/index.html");
  const html = await readFile(page, "utf8");
  await writeFile(page, html.replace("</head>", "<style>article{display:none}</style></head>"));

  const selected = shots().filter((shot) => shot.name === "guide-375-light");
  const error: string[] = [];
  const code = await run({ shots: selected, roots: { "docs-site": copy, "rtl-site": rtl }, capture, log: () => {}, error: (e) => error.push(e) });
  assert.equal(code, 1);
  assert.match(error.join("\n"), /FAIL: visual guide-375-light/);
});
