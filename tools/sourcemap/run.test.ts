import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { validateSourcemap } from "../theme/sourcemap.ts";
import { generateSourcemap, main } from "./run.ts";

const root = join(fileURLToPath(import.meta.url), "../../..");
const fixture = join(root, "fixtures/docs-site");

/** The fixture is built once for the tests that read it; a later test edits a temporary copy instead. */
let cached: Promise<string> | undefined;
const generated = () => (cached ??= generateSourcemap(fixture));

/** Runs `fn` with the console silenced, so a test sees only the assertions. */
async function quiet<T>(fn: () => Promise<T>): Promise<T> {
  const { log, error } = console;
  console.log = console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
}

interface Section {
  readonly id: string;
  readonly level: number;
  readonly line: number;
  readonly text: string;
}

interface LinkEntry {
  readonly href: string;
  readonly line: number;
}

interface PageEntry {
  readonly url: string;
  readonly source: string;
  readonly sections: readonly Section[];
  readonly links: readonly LinkEntry[];
}

const page = (map: { pages: readonly PageEntry[] }, url: string): PageEntry | undefined =>
  map.pages.find((entry) => entry.url === url);

test("the engine's map of fixtures/docs-site validates against the schema", async () => {
  const map = JSON.parse(await generated());
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.equal(map.version, 0);
  assert.ok(map.pages.length > 0, "the fixture has document pages");
});

test("the map names each page's source and keeps the headings' and links' lines", async () => {
  const map = JSON.parse(await generated());
  const quickstart = page(map, "/quickstart/");
  assert.ok(quickstart, "the fixture has /quickstart/");
  assert.equal(quickstart.source, "quickstart.md");
  assert.deepEqual(quickstart.sections, [
    { id: "quickstart", level: 1, line: 1, text: "Quickstart" },
    { id: "the-first-deploy", level: 2, line: 5, text: "The first deploy" },
    { id: "what-happens-next", level: 2, line: 17, text: "What happens next" },
  ]);
  assert.deepEqual(quickstart.links, [
    { href: "configuration.md", line: 13 },
    { href: "commands.md", line: 15 },
    { href: "output.md", line: 19 },
    { href: "dashboard/", line: 20 },
  ]);
});

test("writing the map and checking it later passes, and a changed page is stale", async () => {
  const site = mkdtempSync(join(tmpdir(), "sourcemap-site-"));
  after(() => rmSync(site, { recursive: true, force: true }));
  cpSync(fixture, site, { recursive: true });

  await quiet(async () => {
    assert.equal(await main([site, "--check"]), 1, "a missing map fails the check");

    assert.equal(await main([site]), 0);
    assert.equal(readFileSync(join(site, "sourcemap.json"), "utf8"), await generated(), "the written map is the engine's");

    assert.equal(await main([site, "--check"]), 0, "an up-to-date map passes the check");

    writeFileSync(join(site, "quickstart.md"), `${readFileSync(join(site, "quickstart.md"), "utf8")}\n## Added later\n`);
    assert.equal(await main([site, "--check"]), 1, "a changed page makes the committed map stale");
  });
});

test("a site with a build error is refused instead of writing a map", async () => {
  const site = mkdtempSync(join(tmpdir(), "sourcemap-bad-"));
  after(() => rmSync(site, { recursive: true, force: true }));
  cpSync(fixture, site, { recursive: true });
  writeFileSync(join(site, "mizzen.yml"), "title: Broken\nunknownKey: true\n");

  await assert.rejects(generateSourcemap(site), /build error/);
});
