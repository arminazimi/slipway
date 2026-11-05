// The per-page social image (`pub.og-image`): the Actions plugin (`_plugins/slipway_og.rb`) writes a
// 1200×630 PNG per page from the title, and `_includes/seo.html` points `og:image` at it. A page with
// an `image` of its own wins; a title the embedded font cannot render keeps the shared default. The
// fixture builds twice: with the plugin copied in, the way an Actions-mode site ships it, and without.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { bundleAvailable, root } from "./build.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const fixture = join(root, "tools/theme/fixtures/og-site");
const work = mkdtempSync(join(tmpdir(), "slipway-og-"));
after(() => rmSync(work, { recursive: true, force: true }));

const head = (path) => readFileSync(join(path), "utf8").split("</head>")[0];
const pngSize = (path) => {
  const png = readFileSync(path);
  assert.equal(png.subarray(1, 4).toString(), "PNG", path);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
};

function build(source, dest) {
  // Without the GitHub Pages gem's overrides, as in an Actions build: not safe, _plugins loaded.
  const result = spawnSync(
    "bundle",
    ["exec", "jekyll", "build", "--source", source, "--destination", dest, "--baseurl", ""],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        PAGES_REPO_NWO: "arminazimi/slipway",
        LANG: "en_US.UTF-8",
        LC_ALL: "en_US.UTF-8",
        JEKYLL_NO_BUNDLER_REQUIRE: "1",
      },
    },
  );
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  return dest;
}

const withPlugin = () => {
  const site = join(work, "actions-site");
  cpSync(fixture, site, { recursive: true });
  cpSync(join(root, "_plugins"), join(site, "_plugins"), { recursive: true });
  return build(site, join(work, "actions"));
};

const withoutPlugin = () => {
  const site = join(work, "classic-site");
  cpSync(fixture, site, { recursive: true });
  return build(site, join(work, "classic"));
};

test("in Actions mode every page with a renderable title gets a 1200 by 630 PNG", { skip }, () => {
  const out = withPlugin();
  for (const path of ["assets/images/og/index.png", "assets/images/og/about.png", "assets/images/og/2026/10/20/welcome.png"]) {
    assert.deepEqual(pngSize(join(out, path)), [1200, 630], path);
  }
  // The page's own `image` wins, and a title the font cannot render keeps the shared picture.
  assert.ok(!existsSync(join(out, "assets/images/og/photo.png")));
  assert.ok(!existsSync(join(out, "assets/images/og/fa.png")));
});

test("in Actions mode pages point at their generated image, large card and all", { skip }, () => {
  const out = withPlugin();
  const home = head(join(out, "index.html"));
  assert.match(home, /<meta property="og:image" content="https:\/\/example\.com\/assets\/images\/og\/index\.png">/);
  assert.match(home, /<meta property="og:image:width" content="1200">/);
  assert.match(home, /<meta property="og:image:height" content="630">/);
  assert.match(home, /<meta property="og:image:alt" content="Home on the og fixture">/);
  assert.match(home, /<meta name="twitter:card" content="summary_large_image">/);

  const post = head(join(out, "2026/10/20/welcome.html"));
  assert.match(post, /og:image" content="https:\/\/example\.com\/assets\/images\/og\/2026\/10\/20\/welcome\.png">/);

  // A page with `image` points there, with no size claims; the Persian page keeps the shared default.
  const photo = head(join(out, "photo.html"));
  assert.match(photo, /<meta property="og:image" content="https:\/\/example\.com\/assets\/images\/cover\.png">/);
  assert.match(photo, /<meta name="twitter:card" content="summary_large_image">/);
  assert.doesNotMatch(photo, /og:image:width/);

  const fa = head(join(out, "fa.html"));
  assert.match(fa, /<meta property="og:image" content="https:\/\/example\.com\/assets\/images\/social\.png">/);
  assert.match(fa, /<meta name="twitter:card" content="summary">/);
});

test("in classic mode nothing is generated and pages share the site's default image", { skip }, () => {
  const out = withoutPlugin();
  assert.ok(!existsSync(join(out, "assets/images/og")));
  const home = head(join(out, "index.html"));
  assert.match(home, /<meta property="og:image" content="https:\/\/example\.com\/assets\/images\/social\.png">/);
  assert.match(home, /<meta name="twitter:card" content="summary">/);
});

test("og: false drops the social tags and the JSON-LD image, and keeps the canonical link", { skip }, () => {
  const out = withoutPlugin();
  const page = head(join(out, "no-card.html"));
  assert.match(page, /<link rel="canonical" href="https:\/\/example\.com\/no-card\.html">/);
  assert.doesNotMatch(page, /property="og:/);
  assert.doesNotMatch(page, /name="twitter:card"/);
  assert.doesNotMatch(page, /"image":/);
});
