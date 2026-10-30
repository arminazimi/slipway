import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { buildSpecSite } from "./build.mjs";
import { bundleAvailable, buildExample, root, target } from "../theme/build.mjs";

const specSiteDir = join(root, "spec/docs-site");

test("spec site builds and schemas are valid", () => {
  // Always build to ensure we're testing fresh output.
  buildSpecSite();

  if (!bundleAvailable()) {
    console.log("SKIP: the spec site was not built: install Ruby 3.3 (.ruby-version) and run `bundle install`");
    return;
  }

  const out = buildExample("gem", join(root, "_site/gem/spec-docs-site"), specSiteDir);

  // Check that every schema was output to the build dir and $id is correct.
  const schemaFiles = readdirSync(join(root, "schema")).filter((f) => f.endsWith(".schema.json"));
  for (const file of schemaFiles) {
    const schemaPath = join(out, "0.1", file);
    assert.ok(existsSync(schemaPath), `schema ${file} missing from built spec site at ${schemaPath}`);
    const schemaJson = JSON.parse(readFileSync(schemaPath, "utf8"));
    assert.equal(schemaJson.$id, `https://arminazimi.github.io/slipway/spec/0.1/${file}`, `schema ${file} has incorrect $id`);
  }

  rmSync(join(root, "_site/gem/spec-docs-site"), { recursive: true, force: true });
});

test("the adapter list is generated with every adapter and linked from the index", () => {
  buildSpecSite();

  const page = readFileSync(join(specSiteDir, "adapters.md"), "utf8");
  assert.match(page, /^---\ntitle: Adapters\ndescription: The generators with a Slipway adapter, and how to add one\.\nlayout: doc\n---\n/);

  const adapters = readdirSync(join(root, "adapters"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  for (const name of adapters) {
    assert.ok(page.includes(`https://github.com/arminazimi/slipway/tree/main/adapters/${name}`), `adapters.md does not link ${name}`);
  }

  const index = readFileSync(join(specSiteDir, "index.md"), "utf8");
  assert.ok(index.includes("](adapters.html)"), "index.md does not link the adapter list");
});
