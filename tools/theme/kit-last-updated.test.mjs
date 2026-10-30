// "Last updated" on doc pages (kit.last-updated): a front-matter `last_modified_at` renders as a
// localized <time> in classic mode, a page without one renders nothing, and in Actions mode the
// plugin (_plugins/slipway_last_modified.rb) fills a missing date from the file's last git commit.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { bundleAvailable, buildExample, root } from "./build.mjs";
import { validateFrontMatter } from "./front-matter.mjs";
import { tmpDir } from "./tmp.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const fixture = join(root, "tools/theme/fixtures/kit-last-updated");
const work = mkdtempSync(join(tmpdir(), "slipway-last-updated-"));
after(() => rmSync(work, { recursive: true, force: true }));

const read = (dir, page) => readFileSync(join(dir, page), "utf8");
const iso = (date) => `${date}T00:00:00(?:Z|[+-]\\d{2}:\\d{2})`;

test("a front-matter last_modified_at renders a localized time and no date renders nothing", { skip }, () => {
  const out = buildExample("gem", tmpDir("kit-last-updated-site"), fixture);

  const dated = read(out, "index.html");
  assert.match(dated, new RegExp(`<p class="sl-last-updated">Last updated <time datetime="${iso("2026-03-04")}">2026-03-04</time></p>`));

  const undated = read(out, "plain.html");
  assert.doesNotMatch(undated, /sl-last-updated|<time datetime/);
});

test("the base schema accepts last_modified_at as a date", () => {
  const page = { layout: "doc", title: "Dated Doc", last_modified_at: "2026-03-04" };
  assert.deepEqual(validateFrontMatter(page, "index.md"), []);
  const problems = validateFrontMatter({ ...page, last_modified_at: "last Tuesday" }, "index.md");
  assert.deepEqual(problems.map((problem) => problem.key), ["last_modified_at"]);
});

const run = (command, args, cwd, env = {}) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", env: { ...process.env, ...env } });
  assert.equal(result.status, 0, `${command} ${args.join(" ")}: ${result.stdout}${result.stderr}`);
};

const commit = (cwd, date) =>
  run(
    "git",
    ["-c", "user.name=Slipway", "-c", "user.email=slipway@example.com", "commit", "-q", "-m", "fixture"],
    cwd,
    { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
  );

// Plain Jekyll without the GitHub Pages gem's overrides, as in Actions mode: not safe, _plugins loaded.
function buildActions(source, dest) {
  const result = spawnSync("bundle", ["exec", "jekyll", "build", "--source", source, "--destination", dest, "--baseurl", ""], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      PAGES_REPO_NWO: "arminazimi/slipway",
      LANG: "en_US.UTF-8",
      LC_ALL: "en_US.UTF-8",
      JEKYLL_NO_BUNDLER_REQUIRE: "1",
      JEKYLL_ENV: "production",
      TZ: "UTC",
    },
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  return dest;
}

test("in Actions mode the plugin takes a missing date from git and keeps a front-matter one", { skip }, () => {
  const site = join(work, "actions-site");
  cpSync(fixture, site, { recursive: true });
  cpSync(join(root, "_plugins"), join(site, "_plugins"), { recursive: true });
  run("git", ["init", "-q"], site);
  run("git", ["add", "."], site);
  commit(site, "2026-05-06T12:00:00+00:00");
  appendFileSync(join(site, "plain.md"), "\nEdited in a later commit.\n");
  run("git", ["add", "plain.md"], site);
  commit(site, "2026-06-07T12:00:00+00:00");

  const out = buildActions(site, join(work, "actions"));
  assert.match(read(out, "plain.html"), new RegExp(`<time datetime="2026-06-07T12:00:00(?:Z|[+-]\\d{2}:\\d{2})">2026-06-07</time>`));
  assert.match(read(out, "index.html"), new RegExp(`<time datetime="${iso("2026-03-04")}">2026-03-04</time>`));
});
