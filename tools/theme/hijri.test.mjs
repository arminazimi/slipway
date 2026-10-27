import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync, rmSync, cpSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, before, after } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateConfig } from "./config.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const tempSrc = tmpDir("hijri-src");
const tempOut = tmpDir("hijri-out");

test("the arabic setting accepts digits and hijri and nothing else", () => {
  assert.ok(validateConfig({ slipway: { arabic: { digits: true, hijri: true } } }).ok);
  assert.ok(!validateConfig({ slipway: { arabic: { hijri: "yes" } } }).ok);
  assert.ok(!validateConfig({ slipway: { arabic: { calendar: "hijri" } } }).ok);
});

test("Hijri dates calculate correctly using tabular civil algorithm when opted in", { skip }, () => {
  try {
    rmSync(tempSrc, { recursive: true, force: true });
    mkdirSync(tempSrc);
    mkdirSync(join(tempSrc, "_posts"));

    writeFileSync(join(tempSrc, "_config.yml"), `
title: Hijri Test
lang: ar
theme: slipway-theme
slipway:
  arabic:
    hijri: true
    digits: true
`);
    writeFileSync(join(tempSrc, "_posts", "2024-07-08-muharram.md"), "---\n---\nPost 1");
    writeFileSync(join(tempSrc, "_posts", "2025-03-01-ramadan.md"), "---\n---\nPost 2");
    writeFileSync(join(tempSrc, "_posts", "2021-08-09-leap.md"), "---\n---\nPost 3");
    writeFileSync(join(tempSrc, "_posts", "2021-08-10-newyear.md"), "---\n---\nPost 4");

    const out = buildExample("gem", tempOut, tempSrc);
    const time = (file) => readFileSync(join(out, file), "utf8").match(/<time[^>]*>([^<]*)<\/time>/)[1];

    // 2024-07-08 is 1 Muharram 1446 AH (civil tabular algorithm)
    assert.equal(time("2024/07/08/muharram.html"), "١ محرم ١٤٤٦");

    // 2025-03-01 is 1 Ramadan 1446 AH
    assert.equal(time("2025/03/01/ramadan.html"), "١ رمضان ١٤٤٦");

    // 2021-08-09 is 30 Dhu al-Hijjah 1442 AH (1442 is a leap year)
    assert.equal(time("2021/08/09/leap.html"), "٣٠ ذو الحجة ١٤٤٢");

    // 2021-08-10 is 1 Muharram 1443 AH
    assert.equal(time("2021/08/10/newyear.html"), "١ محرم ١٤٤٣");
  } finally {
    rmSync(tempSrc, { recursive: true, force: true });
    rmSync(tempOut, { recursive: true, force: true });
  }
});

test("Option off leaves the output as Gregorian", { skip }, () => {
  try {
    rmSync(tempSrc, { recursive: true, force: true });
    mkdirSync(tempSrc);
    mkdirSync(join(tempSrc, "_posts"));

    writeFileSync(join(tempSrc, "_config.yml"), `
title: Hijri Test Off
lang: ar
theme: slipway-theme
slipway:
  arabic:
    hijri: false
`);
    writeFileSync(join(tempSrc, "_posts", "2024-07-08-muharram.md"), "---\n---\nPost 1");

    const out = buildExample("gem", tempOut, tempSrc);
    const post = readFileSync(join(out, "2024/07/08/muharram.html"), "utf8");

    assert.match(post, /<time[^>]*>2024-07-08<\/time>/);
  } finally {
    rmSync(tempSrc, { recursive: true, force: true });
    rmSync(tempOut, { recursive: true, force: true });
  }
});
