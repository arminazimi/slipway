import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildReport, criteria, main, reportPath } from "./run.ts";

test("the committed page matches the generator, so a stale page fails", () => {
  assert.equal(readFileSync(reportPath, "utf8"), buildReport());
  assert.equal(main([]), 0);
});

test("every criterion is level A or AA, named once, and says how it is tested", () => {
  const seen = new Set<string>();
  for (const c of criteria) {
    assert.ok(c.level === "A" || c.level === "AA");
    assert.ok(!seen.has(c.sc), `${c.sc} is listed twice`);
    seen.add(c.sc);
    assert.ok(c.methods.length > 0 && c.note.length > 0);
  }
});

test("the page says plainly which criteria are checked by hand", () => {
  assert.match(buildReport(), /checked only by hand: /);
});
