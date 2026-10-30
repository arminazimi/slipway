// The podcast starter: the files it carries, the site it builds, and what slipway doctor says of it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { after, test } from "node:test";
import { doctor } from "../../packages/doctor/src/doctor.mjs";
import { exitCode } from "../../packages/doctor/src/cli.mjs";
import { root } from "../theme/tokens.mjs";
import { tmpDir } from "../theme/tmp.mjs";

const starter = join(root, "starters/podcast");
const gemfile = join(root, "Gemfile");

/** The Jekyll of the repository: the GitHub Pages gem, which brings the theme gem with it. */
const bundle = spawnSync("bundle", ["exec", "jekyll", "--version"], {
  cwd: root,
  encoding: "utf8",
  env: { ...process.env, BUNDLE_GEMFILE: gemfile },
});
const skip = bundle.status === 0 ? false : "run `bundle install` to build the starter with the GitHub Pages gem";

/** Builds a copy of the starter with its own plugins on, the way an Actions build does. */
function build(site, out) {
  const result = spawnSync("bundle", ["exec", "jekyll", "build", "--source", site, "--destination", out, "--baseurl", ""], {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
    env: {
      ...process.env,
      BUNDLE_GEMFILE: gemfile,
      PAGES_REPO_NWO: "arminazimi/slipway",
      LANG: "en_US.UTF-8",
      LC_ALL: "en_US.UTF-8",
      JEKYLL_ENV: "production",
      // The Pages gem runs Jekyll in safe mode, where the starter's own plugins stay off.
      JEKYLL_NO_BUNDLER_REQUIRE: "true",
    },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return out;
}

/** The starter, copied and built once, under the repository's .tmp folder. */
let built;
function site() {
  if (built) return built;
  const dir = tmpDir("podcast-starter");
  cpSync(starter, dir, { recursive: true });
  built = { dir, out: build(dir, join(dir, "_site")) };
  return built;
}
after(() => {
  if (built) rmSync(built.dir, { recursive: true, force: true });
});

/** Every tag closes in order: enough to catch an unescaped character or a stray tag in the feed. */
function wellFormed(xml) {
  const stack = [];
  const body = xml.replace(/<\?xml[^>]*\?>/, "");
  for (const [, close, name, selfClosing] of body.matchAll(/<(\/?)([A-Za-z][\w:-]*)[^>]*?(\/?)>/g)) {
    if (selfClosing) continue;
    if (!close) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0 && !/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(body);
}

test("the podcast starter has the expected files", () => {
  assert.ok(existsSync(starter), "starters/podcast exists");
  for (const name of [
    "index.md",
    "about.md",
    "episodes.md",
    "tags.md",
    "404.md",
    "feed.xml",
    "AGENTS.md",
    "README.md",
    "_config.yml",
    "_config.remote.yml",
    "content-schemas.json",
    "search.json",
    "sitemap.xml",
    "sourcemap.json",
    "llms.txt",
    "llms-full.txt",
    ".vscode/settings.json",
    ".well-known/agent-skills/index.json",
  ]) {
    assert.ok(existsSync(join(starter, name)), `${name} exists`);
  }
  for (const name of ["_posts", "_data", "_includes", "_plugins", "assets", "audio", "authors", "schema", "transcripts"]) {
    assert.ok(existsSync(join(starter, name)), `${name}/ exists`);
  }
  assert.equal(readdirSync(join(starter, "_posts")).length, 2, "two episodes");
  assert.equal(readdirSync(join(starter, "audio")).length, 2, "two recordings");

  const files = readdirSync(starter);
  assert.ok(!files.some((file) => file.endsWith(".twin.html")), "no twin HTML files");
});

test("the starter ships the theme's plugins, so they cannot go stale", () => {
  for (const name of ["slipway_sourcemap.rb", "slipway_twins.rb"]) {
    assert.equal(readFileSync(join(starter, "_plugins", name), "utf8"), readFileSync(join(root, "_plugins", name), "utf8"), name);
  }
});

test("the starter builds, and slipway doctor reaches the top level", { skip }, async () => {
  const { dir, out } = site();
  assert.ok(existsSync(join(out, "index.html")), "the home page is built");

  const report = await doctor(dir, { build: out });
  assert.deepEqual(report.tests.filter((test) => test.keyword === "MUST" && test.status === "fail"), [], JSON.stringify(report.findings, null, 2));
  assert.equal(report.level, "L3", JSON.stringify(report.findings, null, 2));
  assert.equal(exitCode(report, "L3"), 0, JSON.stringify(report.findings, null, 2));

  // The source map and the agent-skills index are what an agent reads to find the files behind the pages.
  const map = JSON.parse(readFileSync(join(out, "sourcemap.json"), "utf8"));
  assert.ok(map.pages.some((page) => page.source === "_posts/2026-10-20-episode-2-plain-text-plain-audio.md"), "the episodes are in the source map");
  const skills = JSON.parse(readFileSync(join(out, ".well-known/agent-skills/index.json"), "utf8"));
  assert.ok(skills.skills.length, "the agent-skills index lists a skill");
});

test("the built HTML is valid", { skip }, () => {
  const { out } = site();
  const result = spawnSync("npx", ["html-validate", "--config", join(root, ".htmlvalidate.cjs"), out], { encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test("the built feed is RSS with the iTunes namespace, and every episode is in it", { skip }, () => {
  const { dir, out } = site();
  const feed = readFileSync(join(out, "feed.xml"), "utf8");
  assert.ok(wellFormed(feed), "the feed is well-formed XML");
  assert.match(feed, /<rss version="2\.0"[^>]*xmlns:itunes="http:\/\/www\.itunes\.com\/dtds\/podcast-1\.0\.dtd"/);
  assert.match(feed, /<itunes:author>[^<]+<\/itunes:author>/);
  assert.match(feed, /<itunes:image href="[^"]+"\/>/);

  const episodes = readdirSync(join(dir, "_posts"));
  const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
  assert.equal(items.length, episodes.length, "one item per episode");
  for (const item of items) {
    const enclosure = /<enclosure url="([^"]+)" length="(\d+)" type="([^"]+)"\/>/.exec(item);
    assert.ok(enclosure, "the item has an enclosure");
    const [, url, length, type] = enclosure;
    assert.equal(type, "audio/mpeg", "the recording is an MP3");
    const file = join(dir, new URL(url).pathname);
    assert.ok(existsSync(file), `${url} is a file of the site`);
    assert.equal(Number(length), statSync(file).size, "the enclosure names the size of the recording");
    assert.match(item, /<itunes:duration>\d+<\/itunes:duration>/, "the item has a duration");
    assert.match(item, /<itunes:episode>\d+<\/itunes:episode>/, "the item has an episode number");
  }
});

test("the site reads without JavaScript", { skip }, () => {
  const { out } = site();
  const page = readFileSync(join(out, "episodes/episode-1/index.html"), "utf8");
  for (const [, attributes] of page.matchAll(/<script\b([^>]*)>/gi)) {
    if (/\bsrc=/.test(attributes)) assert.match(attributes, /\bdefer\b/, "every script with a source is deferred");
  }
  assert.match(page, /In this episode/, "the show notes are in the HTML");
  assert.match(page, /<link rel="alternate" type="application\/rss\+xml"/, "the head names the podcast feed");
});
