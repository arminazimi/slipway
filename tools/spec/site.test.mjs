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
