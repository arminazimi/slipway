import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { writeRedirects } from "./steps/redirects.mjs";

test("writeRedirects creates static redirect pages", () => {
  const outDir = mkdtempSync(join(tmpdir(), "slipway-redirects-"));
  try {
    const config = {
      redirects: {
        "/old-page.html": "/new-page.html",
        "/old-dir/": "/new-dir/",
        "/no-slash-dir": "/new-dir/",
        "relative.html": "/target.html"
      }
    };

    const written = writeRedirects(config, outDir);

    assert.equal(written.length, 4);
    assert.ok(written.includes("old-page.html"));
    assert.ok(written.includes("old-dir/index.html"));
    assert.ok(written.includes("no-slash-dir/index.html"));
    assert.ok(written.includes("relative.html"));

    const checkFile = (path, target) => {
      const content = readFileSync(join(outDir, path), "utf8");
      assert.ok(content.includes(`<link rel="canonical" href="${target}">`), `Missing canonical link in ${path}`);
      assert.ok(content.includes(`<meta http-equiv="refresh" content="0; url=${target}">`), `Missing meta refresh in ${path}`);
      assert.ok(content.includes('<meta name="robots" content="noindex">'), `Missing noindex in ${path}`);
    };

    checkFile("old-page.html", "/new-page.html");
    checkFile("old-dir/index.html", "/new-dir/");
    checkFile("no-slash-dir/index.html", "/new-dir/");
    checkFile("relative.html", "/target.html");

  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});

test("writeRedirects ignores empty or missing redirects", () => {
  const outDir = mkdtempSync(join(tmpdir(), "slipway-redirects-"));
  try {
    assert.equal(writeRedirects({}, outDir).length, 0);
    assert.equal(writeRedirects({ redirects: {} }, outDir).length, 0);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
