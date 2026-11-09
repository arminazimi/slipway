import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import { APP, checkExample, compareTrees, digestTree, inspect, twinFindings, underApp } from "./run.ts";

/** A source app folder, a matching output, and one valid copy of every generated output the gate reads. */
interface Fixture {
  readonly source: string;
  readonly out: string;
}

/** The source app's files; the output starts as an identical copy. */
const APP_FILES: Readonly<Record<string, string>> = {
  "index.html": "<!doctype html><html><body><h1>Beacon deploy dashboard</h1></body></html>\n",
  "style.css": "main { display: grid; }\n",
  "dashboard.js": 'document.title = "Beacon deploy dashboard";\n',
  "data.json": '{"passed":3}\n',
};

/** Writes a file, creating its folder. */
async function write(path: string, contents: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
}

/** Writes a Pagefind fragment the way Pagefind does: one gzip-compressed JSON record. */
async function fragment(dir: string, name: string, url: string): Promise<void> {
  await write(join(dir, "pagefind", "fragment", name), gzipSync(Buffer.from(JSON.stringify({ url, content: "A page." }))));
}

/** A clean build: the app copied byte-for-byte and no output naming it. */
async function fixture(t: { after: (fn: () => void | Promise<void>) => void }): Promise<Fixture> {
  const dir = await mkdtemp(join(tmpdir(), "app-page-check-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const source = join(dir, "source", APP);
  const out = join(dir, "out");

  for (const [path, contents] of Object.entries(APP_FILES)) {
    await write(join(source, path), contents);
    await write(join(out, APP, path), contents);
  }
  await write(join(out, "llms.txt"), "# Beacon\n\n- [Quickstart](https://example.com/quickstart/)\n");
  await write(join(out, "llms-full.txt"), "# Beacon - full text\n\n## Quickstart\n\nFive commands.\n");
  await write(
    join(out, "sourcemap.json"),
    `${JSON.stringify({ version: 0, pages: [{ url: "/quickstart/", source: "quickstart.md", sections: [], links: [] }] })}\n`,
  );
  await fragment(out, "en_quickstart.pf_fragment", "/quickstart/");
  return { source, out };
}

test("digestTree hashes every file under its relative path", async (t) => {
  const { source } = await fixture(t);
  const digests = await digestTree(source);
  assert.deepEqual([...digests.keys()], ["dashboard.js", "data.json", "index.html", "style.css"]);
  assert.equal(digests.get("style.css"), createHash("sha256").update(APP_FILES["style.css"]).digest("hex"));
});

test("a clean build has no findings", async (t) => {
  const { source, out } = await fixture(t);
  assert.deepEqual(await inspect({ source, out }), { appFiles: 4, findings: [] });
});

test("a changed, missing, or extra dashboard file fails the copy check", async (t) => {
  const { source, out } = await fixture(t);
  await write(join(out, APP, "style.css"), "main { display: flex; }\n");
  await rm(join(out, APP, "dashboard.js"));
  await write(join(out, APP, "extra.js"), "console.log('extra');\n");

  const report = await inspect({ source, out });
  assert.deepEqual(report.findings, [
    { check: "copy", message: "dashboard/dashboard.js: missing" },
    { check: "copy", message: "dashboard/extra.js: extra" },
    { check: "copy", message: "dashboard/style.css: changed" },
  ]);
});

test("compareTrees reports every file that differs", () => {
  const source = new Map([["a.html", "1"], ["b.css", "2"]]);
  const output = new Map([["a.html", "3"], ["c.js", "2"]]);
  assert.deepEqual(compareTrees(source, output), [
    { path: "a.html", kind: "changed" },
    { path: "b.css", kind: "missing" },
    { path: "c.js", kind: "extra" },
  ]);
});

test("a Pagefind fragment for the dashboard fails the search check", async (t) => {
  const { source, out } = await fixture(t);
  await fragment(out, "en_dashboard.pf_fragment", "/dashboard/");
  const findings = (await inspect({ source, out })).findings;
  assert.deepEqual(findings, [{ check: "search", message: "en_dashboard.pf_fragment indexes /dashboard/" }]);
});

test("a search index with no fragments is not silently accepted", async (t) => {
  const { source, out } = await fixture(t);
  await rm(join(out, "pagefind"), { recursive: true });
  const findings = (await inspect({ source, out })).findings;
  assert.deepEqual(findings, [{ check: "search", message: "no Pagefind fragments to inspect" }]);
});

test("an llms file that links to the dashboard fails the llms check", async (t) => {
  const { source, out } = await fixture(t);
  await write(join(out, "llms-full.txt"), "# Beacon\n\n- [Dashboard](https://example.com/dashboard/)\n");
  const findings = (await inspect({ source, out })).findings;
  assert.deepEqual(findings, [{ check: "llms", message: "llms-full.txt links to dashboard" }]);
});

test("prose that mentions the dashboard is not a link", async (t) => {
  const { source, out } = await fixture(t);
  await write(join(out, "llms.txt"), "# Beacon\n\nOpen the dashboard for the last runs.\n");
  assert.deepEqual((await inspect({ source, out })).findings, []);
});

test("a Markdown twin for the dashboard fails the twin check", async (t) => {
  const { out } = await fixture(t);
  await write(join(out, APP, "index.md"), "# Beacon deploy dashboard\n");
  assert.deepEqual(await twinFindings(out), [{ check: "twins", message: "dashboard/index.md exists" }]);
});

test("a source map page for the dashboard fails the source map check", async (t) => {
  const { source, out } = await fixture(t);
  await write(
    join(out, "sourcemap.json"),
    `${JSON.stringify({
      version: 0,
      pages: [
        { url: "/quickstart/", source: "quickstart.md", sections: [], links: [] },
        { url: "/dashboard/", source: "dashboard/index.html", sections: [], links: [] },
      ],
    })}\n`,
  );
  const findings = (await inspect({ source, out })).findings;
  assert.deepEqual(findings, [{ check: "sourcemap", message: "/dashboard/ is a page entry" }]);
});

test("a link to the dashboard from a doc page stays in the source map", async (t) => {
  const { source, out } = await fixture(t);
  await write(
    join(out, "sourcemap.json"),
    `${JSON.stringify({
      version: 0,
      pages: [{ url: "/quickstart/", source: "quickstart.md", sections: [], links: [{ href: "dashboard/", line: 1 }] }],
    })}\n`,
  );
  assert.deepEqual((await inspect({ source, out })).findings, []);
});

test("underApp matches the app page and its files, not a name that starts with it", () => {
  for (const url of ["/dashboard/", "/dashboard", "/dashboard/index.html", "/dashboard/index.htm", "/dashboard/deep/app.js", "/dashboard/?page=2"]) {
    assert.equal(underApp(url, APP), true, url);
  }
  for (const url of ["/", "/dashboard-2/", "/dashboards/", "/dashboard.css", "/guide/", "/Dashboard/"]) {
    assert.equal(underApp(url, APP), false, url);
  }
});

test("the dashboard of examples/product-docs is copied byte-for-byte and absent from every output", async () => {
  const report = await checkExample();
  assert.deepEqual(report.findings, []);
  assert.equal(report.appFiles, 4);
});
