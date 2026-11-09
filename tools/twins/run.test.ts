import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { parseFrontMatter } from "../../packages/engine/src/content/frontmatter.ts";
import { twinUrl } from "../../packages/engine/src/outputs/twins.ts";
import { builtSite } from "../fixture-build/build.ts";
import { root } from "../root.ts";
import { defaultOut, main, parseArgs, twinFiles, writeTwins, type Options } from "./run.ts";

/** The fixture every test builds: the same one the tool writes by default. */
const SITE = "fixtures/docs-site";

/** One page entry of the build manifest, as these tests read it. */
interface ManifestPage {
  readonly url: string;
  readonly source: string;
  readonly outputs: readonly string[];
}

/** The build is shared by every test and made once. */
let building: Promise<string> | undefined;
function docs(): Promise<string> {
  return (building ??= builtSite("docs-site"));
}

/** The manifest of a build, with the fields these tests read. */
async function manifest(out: string): Promise<ManifestPage[]> {
  const file = join(out, ".slipway/manifest.json");
  const parsed = JSON.parse(await readFile(file, "utf8")) as { pages: ManifestPage[] };
  return parsed.pages;
}

/** Parses arguments, failing the test when the tool rejects a command line it should accept. */
function options(args: readonly string[], repo = root): Options {
  const parsed = parseArgs(args, repo);
  assert.ok(typeof parsed !== "string", `unexpected rejection: ${parsed}`);
  return parsed;
}

test("the fixture's twins are one per doc page, named by the engine's twin rule, and an app page has none", async () => {
  const out = await docs();
  const pages = await manifest(out);
  const twins = await twinFiles(out);

  assert.equal(pages.length, 593, "the fixture's page count");
  assert.equal(twins.length, pages.length, "one twin per page");
  assert.equal(new Set(twins.map((twin) => twin.path)).size, twins.length, "no path written twice");
  assert.deepEqual(
    twins.map((twin) => twin.url).sort(),
    pages.map((page) => page.url).sort(),
    "every page, and only a page, has a twin",
  );

  for (const page of pages) {
    const url = twinUrl(page.url);
    assert.ok(url, `${page.url} has a twin`);
    const twin = twins.find((candidate) => candidate.url === page.url);
    assert.equal(twin?.path, url.replace(/^\//, ""), `${page.url} is named by twinUrl`);
  }

  const paths = twins.map((twin) => twin.path);
  assert.ok(paths.includes("index.md"), "the site root gives index.md");
  assert.ok(paths.includes("404.md"), "a URL naming 404.html gives 404.md");
  assert.ok(paths.includes("install/index.md"), "a pretty URL twins inside its folder");
  assert.ok(paths.includes("reference/build/index.md"), "a nested pretty URL keeps its folder");
  assert.ok(!paths.some((path) => path.startsWith("dashboard/")), "the app page writes no twin");
  assert.ok(existsSync(join(out, "dashboard/index.html")), "the app page itself is in the build");
  assert.ok(!existsSync(join(out, "dashboard/index.md")), "no twin sits beside the app page");
});

test("a twin is the page's Markdown, with its front matter removed", async () => {
  const out = await docs();
  const pages = new Map((await manifest(out)).map((page) => [page.url, page]));
  const twins = await twinFiles(out);

  for (const twin of twins) {
    const page = pages.get(twin.url);
    assert.ok(page, `${twin.url} is a manifest page`);
    const source = await readFile(join(root, SITE, page.source), "utf8");
    assert.equal(twin.contents, parseFrontMatter(source, page.source).body, `${twin.path} is the page's Markdown`);
  }

  const notFound = twins.find((twin) => twin.path === "404.md");
  assert.ok(notFound, "404.md is written");
  assert.ok(!notFound.contents.startsWith("---"), "front matter is gone");
  assert.doesNotMatch(notFound.contents, /^permalink:/m, "no front matter key survives");
});

test("writeTwins writes one file per twin, removes a stale twin, and leaves other files alone", async (t) => {
  const out = await docs();
  const dir = await mkdtemp(join(tmpdir(), "slipway-twins-"));
  t.after(() => rm(dir, { recursive: true, force: true }));

  // A twin left by an earlier run at an address the site no longer uses, and a file the tool must not touch.
  await mkdir(join(dir, "quickstart"), { recursive: true });
  await writeFile(join(dir, "quickstart", "old.md"), "stale\n");
  await writeFile(join(dir, "notes.txt"), "keep\n");

  const twins = await writeTwins(out, dir);

  assert.deepEqual(
    twins.map((twin) => twin.path),
    (await twinFiles(out)).map((twin) => twin.path),
    "the written list is the engine's list",
  );
  for (const twin of twins) assert.equal(await readFile(join(dir, twin.path), "utf8"), twin.contents, twin.path);
  assert.ok(!existsSync(join(dir, "quickstart", "old.md")), "the stale twin is removed");
  assert.equal(await readFile(join(dir, "notes.txt"), "utf8"), "keep\n", "a file that is not a twin is left alone");
});

test("the default is fixtures/docs-site in .tmp/twins; --site and --out change it; a bad command line is a message", () => {
  assert.deepEqual(options([]), { fixture: "docs-site", out: defaultOut(root, "docs-site") });
  assert.deepEqual(options(["--site", "rtl-site"]), { fixture: "rtl-site", out: defaultOut(root, "rtl-site") });
  assert.deepEqual(options(["--out", "/tmp/twins"]), { fixture: "docs-site", out: resolve("/tmp/twins") });
  assert.deepEqual(options(["--site", "docs-site", "--out", "/tmp/twins"]), { fixture: "docs-site", out: resolve("/tmp/twins") });

  assert.equal(typeof parseArgs(["--site", "missing"], root), "string", "an unknown fixture is rejected");
  assert.equal(typeof parseArgs(["--site"], root), "string", "a flag without a value is rejected");
  assert.equal(typeof parseArgs(["docs-site"], root), "string", "a positional argument is rejected");
});

test("main builds the default fixture, writes its twins, and returns 0; a bad command line returns 2", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "slipway-twins-main-"));
  t.after(() => rm(dir, { recursive: true, force: true }));

  // The tool reports where it wrote, and a rejected command line explains itself: keep both out of the test output.
  const { log, error } = console;
  console.log = console.error = () => {};
  try {
    assert.equal(await main(["--out", dir], root), 0);
    assert.equal(await main(["--site", "missing"], root), 2);
  } finally {
    console.log = log;
    console.error = error;
  }

  const twins = await twinFiles(await docs());
  for (const twin of twins) assert.equal(await readFile(join(dir, twin.path), "utf8"), twin.contents, twin.path);
});
