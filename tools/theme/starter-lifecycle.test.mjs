import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { root } from "./build.mjs";

test("lifecycle starter workflow is valid and uses the pinned action", () => {
  const source = readFileSync(join(root, "starter-files/optional/.github/workflows/lifecycle.yml"), "utf8");
  const doc = parse(source);
  assert.ok(doc.jobs.evergreen);

  const step = doc.jobs.evergreen.steps.find((s) => s.uses?.startsWith("arminazimi/evergreen"));
  assert.ok(step, "missing Evergreen action step");
  assert.equal(
    step.uses,
    "arminazimi/evergreen@21304c78171c303c7263f27e93cec9e1b7c704eb",
    "must use the pinned Evergreen action"
  );
});
