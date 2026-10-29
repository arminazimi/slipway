import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { bundleAvailable, exampleNames, root } from "../theme/build.mjs";
import { committedTwins, generateTwins, main } from "./run.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to generate the twins with the GitHub Pages gem";
const fixture = join(root, "tools/theme/fixtures/twins-site");
// The Pages gem builds in safe mode, so a source under the symlinked /var/folders fails its
// realpath prefix check on every include; build from the real path, as buildExample does.
const work = mkdtempSync(join(realpathSync(tmpdir()), "slipway-twins-"));
after(() => rmSync(work, { recursive: true, force: true }));

function jekyll(source, dest, env = {}) {
  const result = spawnSync("bundle", ["exec", "jekyll", "build", "--source", source, "--destination", dest, "--baseurl", ""], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PAGES_REPO_NWO: "arminazimi/slipway", LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8", ...env },
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  return dest;
}

/** What a twin must hold: the source after the line that closes its front matter. */
const body = (source) => source.replace(/^---[ \t]*\r?\n[\s\S]*?^---[ \t]*(\r?\n|$)/m, "");

const quiet = (fn) => {
  const { log, error } = console;
  console.log = console.error = () => {};
  try {
    return fn();
  } finally {
    console.log = log;
    console.error = error;
  }
};

/** The fixture with its stubs written, as a site would commit them. */
let classic;
function classicSite() {
  if (classic) return classic;
  classic = join(work, "classic-site");
  cpSync(fixture, classic, { recursive: true });
  quiet(() => main([classic]));
  return classic;
}

// Every source page, its twin's address in the build, and its stub.
const expected = [
  { source: "_docs/intro.md", twin: "docs/intro.md", stub: "docs-intro.twin.html" },
  { source: "_posts/2026-10-20-hello.md", twin: "2026/10/20/hello.md", stub: "posts-2026-10-20-hello.twin.html" },
  { source: "about.md", twin: "about.md", stub: "about.twin.html" },
  { source: "guide/install.md", twin: "guide/install/index.md", stub: "guide/install.twin.html" },
];

test("one stub per Markdown source with front matter, beside it or above its underscore folder", { skip }, () => {
  const stubs = generateTwins(fixture);
  assert.deepEqual(Object.keys(stubs), expected.map((e) => e.stub).sort());
  for (const { source, twin, stub } of expected) {
    assert.match(stubs[stub], new RegExp(`^permalink: /${twin.replace(/\./g, "\\.")}$`, "m"), stub);
    assert.match(stubs[stub], new RegExp(`^twin_of: ${source}$`, "m"), stub);
    assert.match(stubs[stub], /^layout: null$/m, stub);
  }
  // plain.md has no front matter: Jekyll copies it as is. tags.md is on a listing layout.
  assert.ok(!Object.values(stubs).some((text) => text.includes("plain.md") || text.includes("tags.md")));
});

test("on classic Pages each twin is the source without its front matter, and the page links it", { skip }, () => {
  const out = jekyll(classicSite(), join(work, "classic"));
  for (const { source, twin } of expected) {
    assert.equal(readFileSync(join(out, twin), "utf8"), body(readFileSync(join(fixture, source), "utf8")), twin);
  }
  // A rule (---) in the body, and one at its very end, survive.
  assert.match(readFileSync(join(out, "about.md"), "utf8"), /rule\.\n\n---\n$/);
  assert.match(readFileSync(join(out, "about.html"), "utf8"), /<link rel="alternate" type="text\/markdown" href="\/about\.md">/);
  assert.match(readFileSync(join(out, "guide/install/index.html"), "utf8"), /href="\/guide\/install\/index\.md"/);
  assert.equal(readFileSync(join(out, "plain.md"), "utf8"), readFileSync(join(fixture, "plain.md"), "utf8"));
  // The stubs are no pages of their own.
  assert.ok(!existsSync(join(out, "about.twin.html")));
  assert.doesNotMatch(readFileSync(join(out, "index.html"), "utf8"), /text\/markdown/);
  assert.doesNotMatch(readFileSync(join(out, "tags/index.html"), "utf8"), /text\/markdown/);
  assert.ok(!existsSync(join(out, "tags/index.md")));
});

test("in Actions mode the plugin writes the same twins at build and drops the stubs", { skip }, () => {
  const out = jekyll(classicSite(), join(work, "classic-again"));
  const site = join(work, "actions-site");
  cpSync(classicSite(), site, { recursive: true });
  cpSync(join(root, "_plugins"), join(site, "_plugins"), { recursive: true });
  // A stale stub must not win over the plugin.
  writeFileSync(join(site, "about.twin.html"), "---\nlayout: null\npermalink: /about.md\ntwin_of: about.md\n---\nstale\n");
  // Without the GitHub Pages gem's overrides, as in an Actions build: not safe, _plugins loaded.
  const actions = jekyll(site, join(work, "actions"), { JEKYLL_NO_BUNDLER_REQUIRE: "1" });
  for (const { twin } of expected) assert.equal(readFileSync(join(actions, twin), "utf8"), readFileSync(join(out, twin), "utf8"), twin);
  assert.match(readFileSync(join(actions, "about.html"), "utf8"), /<link rel="alternate" type="text\/markdown" href="\/about\.md">/);
});

test("npm run twins writes the stubs and --check fails when one is missing, stale, or left over", { skip }, () => {
  const site = join(work, "check-site");
  cpSync(fixture, site, { recursive: true });
  const exitCode = process.exitCode;
  try {
    quiet(() => main([site, "--check"]));
    assert.equal(process.exitCode, 1);
    process.exitCode = undefined;
    quiet(() => main([site]));
    assert.deepEqual(committedTwins(site), expected.map((e) => e.stub).sort());
    quiet(() => main([site, "--check"]));
    assert.equal(process.exitCode, undefined);
    // The page moves: its old stub is stale.
    writeFileSync(join(site, "guide/install.md"), readFileSync(join(site, "guide/install.md"), "utf8").replace("/guide/install/", "/guide/setup/"));
    quiet(() => main([site, "--check"]));
    assert.equal(process.exitCode, 1);
    process.exitCode = undefined;
    // The page is deleted: writing removes its stub.
    rmSync(join(site, "guide/install.md"));
    quiet(() => main([site]));
    assert.ok(!existsSync(join(site, "guide/install.twin.html")));
    quiet(() => main([site, "--check"]));
    assert.equal(process.exitCode, undefined);
  } finally {
    process.exitCode = exitCode;
  }
});

test("every example's committed stubs are up to date", { skip }, () => {
  // The bare example proves a site needs only two files, so it has no stubs (tools/theme/bare.test.mjs).
  for (const name of exampleNames().filter((n) => n !== "bare")) {
    const site = join(root, "examples", name);
    const stubs = generateTwins(site);
    assert.deepEqual(committedTwins(site), Object.keys(stubs), name);
    for (const [path, text] of Object.entries(stubs)) assert.equal(readFileSync(join(site, path), "utf8"), text, `examples/${name}/${path}`);
  }
});
