import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { bundleAvailable, buildExample, root } from "./build.mjs";

test("CSP and inline styles/scripts", { skip: bundleAvailable() ? false : "bundle not available" }, () => {
  const initHtml = readFileSync(join(root, "_includes/theme-init.html"), "utf8");
  const initMatch = initHtml.match(/<script>(.*?)<\/script>/s);
  assert.ok(initMatch, "theme-init.html must contain a <script> block");
  const initScriptContent = initMatch[1];
  const initHash = "sha256-" + createHash("sha256").update(initScriptContent).digest("base64");

  const docs = readFileSync(join(root, "docs/security-headers.md"), "utf8");
  assert.ok(docs.includes(initHash), "docs/security-headers.md must mention the exact sha256 hash of the theme-init script");

  const work = mkdtempSync(join(tmpdir(), "slipway-csp-test-"));
  try {
    const siteOut = buildExample("gem", join(work, "site"), "minimal");

    const walk = (current) => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const path = join(current, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (entry.name.endsWith(".html")) {
          const html = readFileSync(path, "utf8");

          // Check for inline event handlers
          const onHandlers = [...html.matchAll(/\s(on[a-z]+)=["']/gi)];
          if (onHandlers.length > 0) {
             assert.fail(`${entry.name} contains inline event handlers: ${onHandlers.map(m => m[1]).join(", ")}`);
          }

          // Check for inline style attributes
          const styleAttrs = [...html.matchAll(/\s(style)=["']/gi)];
          if (styleAttrs.length > 0) {
             assert.fail(`${entry.name} contains inline style attributes`);
          }

          // Check for inline scripts (excluding JSON-LD and the init script)
          const scriptBlocks = [...html.matchAll(/<script\b[^>]*>(.*?)<\/script>/gis)];
          for (const match of scriptBlocks) {
            const tag = match[0];
            const content = match[1].trim();

            // Allow JSON-LD
            if (tag.includes('type="application/ld+json"')) continue;
            if (tag.includes('type="application/json"')) continue;

            // Allow empty tags (external scripts with src)
            if (content === "") continue;

            // Must be the exact init script content
            if (content !== initScriptContent.trim()) {
               assert.fail(`${entry.name} contains unauthorized inline script: ${content.substring(0, 50)}...`);
            }
          }
        }
      }
    };
    walk(siteOut);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
