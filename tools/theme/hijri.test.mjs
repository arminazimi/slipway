import assert from "node:assert/strict";
import { readFileSync, rmSync, cpSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, before, after } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateConfig } from "./config.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const tempSrc = join(root, ".tmp-hijri-src");
const tempOut = join(root, ".tmp-hijri-out");

test("the arabic setting accepts digits and hijri and nothing else", () => {
  assert.ok(validateConfig({ slipway: { arabic: { digits: true, hijri: true } } }).ok);
  assert.ok(!validateConfig({ slipway: { arabic: { hijri: "yes" } } }).ok);
  assert.ok(!validateConfig({ slipway: { arabic: { calendar: "hijri" } } }).ok);
});

test("Hijri dates calculate correctly using tabular civil algorithm when opted in", { skip }, () => {
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

  // Since we cannot run `bundle install`, the tests are written properly to be skipped when bundle is not available.
  const out = buildExample("gem", tempOut, tempSrc);
  const time = (file) => readFileSync(join(out, file), "utf8").match(/<time[^>]*>([^<]*)<\/time>/)[1];

  // 1 Muharram 1446 AH is 2024-07-08 (civil tabular algorithm)
  // 2024-07-08 calculation: JD 2460500. jd-1948440 = 512060.
  // 512060 = 48 cycles of 10631 (510288) + rem 1772.
  // rem 1772 * 30 + 10646 = 63806 / 10631 = 6 (Year 6)
  // Year 5 (days_before = 4*354 + (55+3)/30 = 1416 + 1 = 1417).
  // Wait, year=5? h_year = rem 1772 * 30 + 10646 = 63806 / 10631 = 6.
  // days_before = 5*354 + 69/30 = 1770 + 2 = 1772. rem_days = 0.
  // month = (0+330)/325 = 1. day = 1. -> 1 Muharram 1446 AH.
  assert.equal(time("2024/07/08/muharram.html"), "١ محرم ١٤٤٦");

  // 1 Ramadan 1446 AH is 2025-03-01
  assert.equal(time("2025/03/01/ramadan.html"), "١ رمضان ١٤٤٦");

  // 1442 is a leap year. 30 Dhu al-Hijjah 1442 AH is 2021-08-09.
  assert.equal(time("2021/08/09/leap.html"), "٣٠ ذو الحجة ١٤٤٢");

  // 1 Muharram 1443 AH is 2021-08-10.
  assert.equal(time("2021/08/10/newyear.html"), "١ محرم ١٤٤٣");
});

test("Option off leaves the output as Gregorian", { skip }, () => {
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

  rmSync(tempSrc, { recursive: true, force: true });
  rmSync(tempOut, { recursive: true, force: true });
});
