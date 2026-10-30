import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("audio block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-audio-out");
  const testSite = join(root, ".tmp/block-audio-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
episode:
  src: audio/episode-12.mp3
  title: Episode 12
  chapters:
    - time: "00:00"
      title: Introduction
    - time: "04:10"
      title: Chapters
  transcript_label: Read the transcript
  transcript: "**Host:** Welcome back."
---
{% include blocks/audio.html src=page.episode.src title=page.episode.title chapters=page.episode.chapters transcript=page.episode.transcript transcript_label=page.episode.transcript_label %}
{% include blocks/audio.html title="No source" %}`;

  writeFileSync(join(testSite, "index.html"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<figure class="sl-audio">'), "Should render the audio figure");
  assert.ok(
    html.includes('<audio controls preload="metadata" src="/audio/episode-12.mp3"></audio>'),
    "Should render a native audio player with the resolved source",
  );
  assert.ok(html.includes("<figcaption>Episode 12</figcaption>"), "Should render the title as a figure caption");
  assert.ok(html.includes('<ol class="sl-audio-chapters">'), "Should render the optional chapter list");
  assert.ok(html.includes("<time>00:00</time> Introduction"), "Should render each chapter time and title");
  assert.ok(html.includes("<time>04:10</time> Chapters"), "Should render every chapter");
  assert.ok(html.includes('<details class="sl-audio-transcript">'), "Should render the optional transcript");
  assert.ok(html.includes("<summary>Read the transcript</summary>"), "Should label the transcript from its parameter");
  assert.ok(html.includes("<strong>Host:</strong> Welcome back."), "Should render the transcript as Markdown");
  assert.ok(
    html.includes('<link rel="stylesheet" href="/assets/css/components/audio.css">'),
    "Should link the audio component CSS",
  );
  assert.ok(!html.includes("No source"), "Should render nothing without src");
});
