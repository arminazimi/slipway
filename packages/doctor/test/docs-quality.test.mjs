import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { doctor } from "../src/doctor.mjs";

const fixture = (name) => fileURLToPath(new URL(`fixtures/docs-quality/${name}`, import.meta.url));
const docs = (report) => report.findings.filter((finding) => finding.id.startsWith("docs."));

test("the docs quality checks fire on the broken fixture with file and line", async () => {
  const report = await doctor(fixture("broken"));
  assert.deepEqual(
    docs(report)
      .map(({ id, file, line, severity }) => ({ id, file, line, severity }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    [
      { id: "docs.description", file: "pages/bare.md", line: 2, severity: "warning" },
      { id: "docs.heading-order", file: "pages/skip.md", line: 10, severity: "warning" },
      { id: "docs.orphan", file: "pages/lonely.md", line: undefined, severity: "warning" },
    ],
  );
});

test("the docs quality checks stay silent on the clean fixture", async () => {
  const report = await doctor(fixture("clean"));
  assert.deepEqual(docs(report), []);
});

test("the docs quality checks do not run on a site without a docs navigation", async () => {
  const report = await doctor(fileURLToPath(new URL("fixtures/conforming", import.meta.url)));
  assert.deepEqual(docs(report), []);
});
