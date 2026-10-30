import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("download block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-download-out");
  const testSite = join(root, ".tmp/block-download-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
download:
  url: /assets/images/social.png
  label: Download
  name: social.png
  size: 3.1 KB
  checksum: "55780eb2104156d1d883cb3349d72b10ae1fd7c31dc2897e511748841f275b29"
  name_label: File
  size_label: Size
  checksum_label: SHA-256
---
{% include blocks/download.html url=page.download.url label=page.download.label name=page.download.name size=page.download.size checksum=page.download.checksum name_label=page.download.name_label size_label=page.download.size_label checksum_label=page.download.checksum_label %}

<div id="no-url">{% include blocks/download.html label="Orphan" name="orphan.bin" name_label="File" %}</div>`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.match(html, /<div class="sl-download">/, "Should render the download wrapper");
  assert.match(
    html,
    /<a class="sl-download-button" href="\/assets\/images\/social\.png" download(?:="")?>Download<\/a>/,
    "Should render a download link with the download attribute",
  );
  assert.match(html, /<dl class="sl-download-meta">/, "Should render the metadata list");
  assert.match(html, /<dt>File<\/dt>\s*<dd>social\.png<\/dd>/, "Should render the file name row");
  assert.match(html, /<dt>Size<\/dt>\s*<dd>3\.1 KB<\/dd>/, "Should render the size row");
  assert.match(
    html,
    /<dt>SHA-256<\/dt>\s*<dd class="sl-download-checksum"><code dir="ltr">55780eb2104156d1d883cb3349d72b10ae1fd7c31dc2897e511748841f275b29<\/code><\/dd>/,
    "Should render the checksum row in left-to-right code",
  );
  assert.match(
    html,
    /<link rel="stylesheet" href="\/assets\/css\/components\/download\.css" ?\/?>/,
    "Should link the download component CSS",
  );
  assert.ok(!html.includes("Orphan"), "Should render nothing without a url");
  assert.ok(!html.includes("orphan.bin"), "Should render no metadata rows without a url");
});
