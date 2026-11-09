import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import type { BuildOptions, BuildResult } from "../../packages/engine/src/pipeline/build.ts";
import { builtSite, resetFixtureBuilds, type FixtureBuilder, type FixtureName } from "./build.ts";

/** A stand-in repository: the two fixtures, the engine, the theme, and the lockfile the hash covers. */
function fixtureRoot(t: { after: (fn: () => void) => void }, files: Record<string, string> = {}): string {
  const repo = mkdtempSync(join(tmpdir(), "fixture-build-"));
  t.after(() => {
    resetFixtureBuilds();
    rmSync(repo, { recursive: true, force: true });
  });
  const defaults = {
    "fixtures/docs-site/index.md": "# Docs\n",
    "fixtures/rtl-site/index.md": "# راهنما\n",
    "packages/engine/src/index.ts": "export const version = 1;\n",
    "packages/theme/src/index.ts": "export const name = 'theme';\n",
    "package-lock.json": "{}\n",
  };
  for (const [path, text] of Object.entries({ ...defaults, ...files })) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), text);
  }
  return repo;
}

/** A build that records each call and writes one file, so a test can count builds without the engine. */
function recorder(): { calls: BuildOptions[]; build: FixtureBuilder } {
  const calls: BuildOptions[] = [];
  const build: FixtureBuilder = async (options) => {
    calls.push(options);
    mkdirSync(options.out, { recursive: true });
    writeFileSync(join(options.out, "index.html"), "built\n");
    const result: BuildResult = { out: options.out, files: ["index.html"], diagnostics: [] };
    return result;
  };
  return { calls, build };
}

test("gives each gate the build folder and builds each fixture once per run", async (t) => {
  const root = fixtureRoot(t);
  const cacheDir = join(root, ".tmp/fixture-build");
  const { calls, build } = recorder();

  const docs = await builtSite("docs-site", { root, cacheDir, build });
  const again = await builtSite("docs-site", { root, cacheDir, build });
  const rtl = await builtSite("rtl-site", { root, cacheDir, build });

  assert.equal(docs, join(cacheDir, "docs-site"));
  assert.equal(rtl, join(cacheDir, "rtl-site"));
  assert.equal(again, docs, "a second caller gets the same folder");
  assert.ok(existsSync(join(docs, "index.html")));
  assert.equal(calls.length, 2, "one build per fixture, none for the repeated call");
  assert.deepEqual(
    calls.map((call) => call.root),
    [join(root, "fixtures/docs-site"), join(root, "fixtures/rtl-site")],
  );
  assert.equal(calls[0]!.themeRoot, join(root, "packages/theme"));
  assert.equal(calls[0]!.defaultLayout, "doc");
});

test("reuses a build from an earlier run while the inputs are unchanged", async (t) => {
  const root = fixtureRoot(t);
  const cacheDir = join(root, ".tmp/fixture-build");
  const { calls, build } = recorder();

  await builtSite("docs-site", { root, cacheDir, build });
  assert.equal(calls.length, 1);
  assert.deepEqual(
    readdirSync(cacheDir).sort(),
    ["docs-site", "docs-site.state.json"],
    "the state sits beside the build, never inside the folder a gate reads",
  );

  resetFixtureBuilds();
  const reused = await builtSite("docs-site", { root, cacheDir, build });
  assert.equal(reused, join(cacheDir, "docs-site"));
  assert.equal(calls.length, 1, "a new run trusts the recorded inputs");
});

test("rebuilds when the fixture, the theme, or the engine changes, and not otherwise", async (t) => {
  const root = fixtureRoot(t);
  const cacheDir = join(root, ".tmp/fixture-build");
  const { calls, build } = recorder();
  const count = async () => {
    resetFixtureBuilds();
    await builtSite("docs-site", { root, cacheDir, build });
    return calls.length;
  };

  assert.equal(await count(), 1);

  writeFileSync(join(root, "fixtures/docs-site/index.md"), "# Docs, edited\n");
  assert.equal(await count(), 2, "a fixture edit rebuilds");

  writeFileSync(join(root, "packages/theme/src/index.ts"), "export const name = 'theme, edited';\n");
  assert.equal(await count(), 3, "a theme edit rebuilds");

  writeFileSync(join(root, "packages/engine/src/index.ts"), "export const version = 2;\n");
  assert.equal(await count(), 4, "an engine edit rebuilds");

  // Rewriting a file with the same bytes changes its timestamp, not the build's inputs.
  writeFileSync(join(root, "fixtures/docs-site/index.md"), "# Docs, edited\n");
  assert.equal(await count(), 4, "a timestamp-only change reuses the build");
});

test("a failed build throws, records nothing, and the next call tries again", async (t) => {
  const root = fixtureRoot(t);
  const cacheDir = join(root, ".tmp/fixture-build");
  const failing: FixtureBuilder = async (options) => ({
    out: options.out,
    files: [],
    diagnostics: [{ id: "config.unknown-key", severity: "error", message: "The config has an unknown key." }],
  });

  await assert.rejects(builtSite("docs-site", { root, cacheDir, build: failing }), /config\.unknown-key/);
  assert.equal(existsSync(join(cacheDir, "docs-site.state.json")), false);

  const { calls, build } = recorder();
  const out = await builtSite("docs-site", { root, cacheDir, build });
  assert.equal(out, join(cacheDir, "docs-site"));
  assert.equal(calls.length, 1);
});

test("rejects a fixture it does not know", async (t) => {
  const root = fixtureRoot(t);
  const { build } = recorder();
  await assert.rejects(builtSite("unknown-site" as FixtureName, { root, build }), /unknown fixture "unknown-site"/);
});

test("builds the real fixtures with the engine into .tmp/fixture-build", async (t) => {
  t.after(resetFixtureBuilds);

  const docs = await builtSite("docs-site");
  assert.ok(existsSync(join(docs, "quickstart/index.html")));
  assert.ok(existsSync(join(docs, "llms.txt")));
  assert.ok(existsSync(join(docs, "dashboard/index.html")));

  const rtl = await builtSite("rtl-site");
  assert.ok(existsSync(join(rtl, "index.html")));
  assert.ok(existsSync(join(rtl, "install/index.html")));
});
