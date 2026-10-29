import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { bundleAvailable, root } from "../../../tools/theme/build.mjs";
import { doctor } from "../../doctor/src/doctor.mjs";
import { exitCode } from "../../doctor/src/cli.mjs";
import { main, createSite, siteConfig } from "../src/cli.mjs";
import { copySources, bundledSources, repoSources, themeDirs } from "../src/sources.mjs";

const bin = fileURLToPath(new URL("../bin/create-slipway.mjs", import.meta.url));
const work = mkdtempSync(join(realpathSync(tmpdir()), "create-slipway-"));
after(() => rmSync(work, { recursive: true, force: true }));

/** Runs the real binary with stdin from a pipe, so it has no terminal. */
function run(args) {
  return spawnSync(process.execPath, [bin, ...args], { cwd: work, encoding: "utf8", input: "", timeout: 10_000 });
}

/** A stdin stream that claims to be a terminal and answers the prompts in order. */
function terminal(answers) {
  const input = new PassThrough();
  input.isTTY = true;
  input.end(answers.map((a) => `${a}\n`).join(""));
  return input;
}

function sink() {
  const stream = new PassThrough();
  let text = "";
  stream.on("data", (chunk) => (text += chunk));
  return { stream, text: () => text };
}

test("flags alone create a site from the starter without prompting", () => {
  const result = run(["fa-site", "--title", "T", "--lang", "fa", "--yes"]);
  assert.equal(result.status, 0, result.stderr);
  const site = join(work, "fa-site");
  const config = parse(readFileSync(join(site, "_config.yml"), "utf8"));
  assert.deepEqual(config, { title: "T", lang: "fa", remote_theme: "arminazimi/slipway", plugins: ["jekyll-remote-theme", "jekyll-feed", "jekyll-sitemap"], defaults: [{ scope: { path: "", type: "pages" }, values: { layout: "page" } }] });
  for (const name of readdirSync(repoSources().starter)) if (name !== "_config.yml") assert.ok(existsSync(join(site, name)), `${name} is copied from examples/bare`);
  assert.ok(existsSync(join(site, "Gemfile")));
  assert.match(result.stdout, /bundle exec jekyll serve/);
  assert.match(result.stdout, /slipway doctor/);
  assert.match(result.stdout, /git push/);
});

test("the stubs from starter-files/ are copied, without its README", { skip: !existsSync(repoSources().stubs) && "starter-files/ does not exist yet" }, () => {
  const result = run(["stubs-site", "--yes"]);
  assert.equal(result.status, 0, result.stderr);
  for (const name of readdirSync(repoSources().stubs)) {
    assert.equal(existsSync(join(work, "stubs-site", name)), name !== "README.md", name);
  }
});

test("without a terminal it never prompts and uses the defaults", () => {
  const result = run(["Quiet Site"]);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /\?|: $/m);
  const config = parse(readFileSync(join(work, "Quiet Site", "_config.yml"), "utf8"));
  assert.equal(config.title, "Quiet Site");
  assert.equal(config.lang, "en");
  assert.equal(config.remote_theme, "arminazimi/slipway");
});

test("without a terminal and without a folder it fails with usage instead of prompting", () => {
  const result = run(["--title", "T"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /name a folder/);
});

test("a non-empty folder is refused with exit code 2 and left alone", () => {
  const dir = join(work, "taken");
  mkdirSync(dir);
  writeFileSync(join(dir, "notes.txt"), "keep me");
  const result = run(["taken", "--yes"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /not empty/);
  assert.deepEqual(readdirSync(dir), ["notes.txt"]);
});

test("a folder holding only .git counts as empty", () => {
  mkdirSync(join(work, "cloned", ".git"), { recursive: true });
  assert.equal(run(["cloned", "--yes"]).status, 0);
});

test("bad flags fail with exit code 1", () => {
  assert.equal(run(["x", "--mode", "docker"]).status, 1);
  assert.equal(run(["x", "--lang", "Persian"]).status, 1);
  assert.equal(run(["x", "--colour"]).status, 1);
  assert.equal(run(["a", "b"]).status, 1);
  assert.equal(existsSync(join(work, "x")), false);
});

test("with a terminal it prompts only for the missing values", async () => {
  const out = sink();
  const code = await main(["prompted", "--lang", "de"], { stdin: terminal(["My Title", "gem"]), stdout: out.stream, stderr: out.stream, cwd: work });
  assert.equal(code, 0, out.text());
  assert.match(out.text(), /Site title/);
  assert.match(out.text(), /Mode/);
  assert.doesNotMatch(out.text(), /Folder|Language code/);
  const config = parse(readFileSync(join(work, "prompted", "_config.yml"), "utf8"));
  assert.deepEqual(config, { title: "My Title", lang: "de", theme: "slipway-theme", plugins: ["jekyll-feed", "jekyll-sitemap"], defaults: [{ scope: { path: "", type: "pages" }, values: { layout: "page" } }] });
  assert.match(readFileSync(join(work, "prompted", "Gemfile"), "utf8"), /gem "slipway-theme"/);
});

test("--yes skips the prompts even on a terminal", async () => {
  const out = sink();
  const code = await main(["yes-site", "--yes"], { stdin: terminal([]), stdout: out.stream, stderr: out.stream, cwd: work });
  assert.equal(code, 0, out.text());
  assert.doesNotMatch(out.text(), /Site title/);
});

test("template mode copies the theme folders and sets no theme", () => {
  assert.equal(run(["tpl", "--mode", "template", "--yes"]).status, 0);
  for (const dir of themeDirs) if (existsSync(join(root, dir))) assert.ok(existsSync(join(work, "tpl", dir)), dir);
  const config = parse(readFileSync(join(work, "tpl", "_config.yml"), "utf8"));
  assert.equal(config.theme, undefined);
  assert.equal(config.remote_theme, undefined);
});

test("titles with YAML syntax survive the round trip", () => {
  for (const title of ['Ali: "notes" # 1', "اسلیپ‌وی", "- yes", "{x}"]) {
    assert.equal(parse(siteConfig({ title, lang: "en", mode: "remote" })).title, title);
  }
});

const ruby = bundleAvailable();
for (const [mode, lang] of [["gem", "fa"], ["template", "en"]]) {
  test(`a new ${mode}-mode site builds with the GitHub Pages gem`, { skip: !ruby && "Ruby and `bundle install` are missing" }, () => {
    const name = `built-${mode}`;
    assert.equal(run([name, "--title", "T", "--lang", lang, "--mode", mode, "--yes"]).status, 0);
    const out = join(work, `${name}-out`);
    // Built with the repository's bundle, whose Gemfile carries the local theme gem.
    const result = spawnSync("bundle", ["exec", "jekyll", "build", "--source", join(work, name), "--destination", out, "--baseurl", ""], {
      cwd: join(work, name),
      encoding: "utf8",
      env: { ...process.env, PAGES_REPO_NWO: "arminazimi/slipway", LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8", JEKYLL_ENV: "production", JEKYLL_NO_BUNDLER_REQUIRE: "true", BUNDLE_GEMFILE: join(root, "Gemfile") },
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const page = readFileSync(join(out, "index.html"), "utf8");
    assert.match(page, /<title>/);
    assert.match(page, new RegExp(`<html[^>]* lang="${lang}"`));
  });
}

for (const mode of ["remote", "gem", "template"]) {
  test(`packed ${mode} starter completes the L2 agent verification loop offline`, { skip: !ruby && "Ruby and `bundle install` are missing" }, async () => {
    const packed = join(work, `packed-${mode}`);
    copySources(repoSources(), packed);
    const source = join(work, `agent-${mode}`);
    createSite({ dir: source, title: "Agent loop", lang: "en", mode }, bundledSources(packed));
    // Remote theme fetching is already covered separately. Build against the same local theme
    // so this contract regression needs neither GitHub nor a published gem/package.
    if (mode === "remote") {
      const config = join(source, "_config.yml");
      writeFileSync(config, readFileSync(config, "utf8").replace(/^remote_theme:.*$/m, "theme: slipway-theme").replace(/^  - jekyll-remote-theme\n/m, ""));
    }
    const build = join(source, "_site");
    const rebuild = () => {
      const result = spawnSync("bundle", ["exec", "jekyll", "build", "--source", source, "--destination", build, "--baseurl", ""], {
        cwd: source, encoding: "utf8", timeout: 60_000,
        env: { ...process.env, PAGES_REPO_NWO: "arminazimi/slipway", LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8", JEKYLL_ENV: "production", JEKYLL_NO_BUNDLER_REQUIRE: "true", BUNDLE_GEMFILE: join(root, "Gemfile") },
      });
      assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    };
    const clean = async () => {
      const report = await doctor(source, { build });
      assert.equal(exitCode(report, "L2"), 0, JSON.stringify(report.findings));
      assert.deepEqual(report.tests.filter(t => t.keyword === "MUST" && ["L0", "L1", "L2"].includes(t.level) && t.status === "fail"), []);
      assert.equal(report.tests.find(t => t.id === "ae.schemas.resolve").reason, undefined, "schemas resolve locally");
    };
    rebuild();
    await clean();
    const page = join(source, "about.md");
    const valid = "---\ntitle: About\nlayout: page\n---\n\n## About us\n\nHello.\n";
    writeFileSync(page, valid);
    rebuild();
    await clean();
    writeFileSync(page, valid.replace("title: About", "title: [About]"));
    rebuild();
    const broken = await doctor(source, { build });
    assert.equal(exitCode(broken, "L2"), 1);
    assert.ok(broken.findings.some(f => f.id === "ae.schemas.valid" && f.in === "source" && f.file === "about.md" && f.line === 2));
    writeFileSync(page, valid);
    rebuild();
    await clean();
  });
}
