import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkoutDir, cliPath, ensureSeaworthy, readPin } from "./setup.mjs";

const pin = { repository: "arminazimi/seaworthy", commit: "a".repeat(40) };
const temp = () => mkdtempSync(join(tmpdir(), "slipway-seaworthy-test-"));

test("pin.json holds a full commit SHA", () => {
  const real = readPin();
  assert.match(real.commit, /^[0-9a-f]{40}$/);
  assert.equal(real.repository, "arminazimi/seaworthy");
});

test("readPin rejects a branch or tag", () => {
  const dir = temp();
  const file = join(dir, "pin.json");
  writeFileSync(file, JSON.stringify({ repository: "arminazimi/seaworthy", commit: "main" }));
  assert.throws(() => readPin(file), /40-character SHA/);
});

test("ensureSeaworthy fetches the pinned commit, builds, and stamps it", () => {
  const base = temp();
  const calls = [];
  const run = (command, args, cwd) => {
    calls.push([command, ...args].join(" "));
    if (command === "npx") {
      mkdirSync(join(cwd, "packages/verify/dist/src"), { recursive: true });
      writeFileSync(cliPath(base), "");
    }
  };
  assert.equal(ensureSeaworthy({ base, pin, run }), cliPath(base));
  assert.deepEqual(calls, [
    "git init -q",
    `git fetch -q --depth 1 https://github.com/arminazimi/seaworthy.git ${pin.commit}`,
    "git checkout -q FETCH_HEAD",
    "npm ci --silent --ignore-scripts --no-audit --no-fund",
    "npx tsc -b packages/verify",
  ]);
  assert.equal(readFileSync(join(checkoutDir(base), ".slipway-pin"), "utf8").trim(), pin.commit);
});

test("ensureSeaworthy reuses a build at the pinned commit and rebuilds on a new pin", () => {
  const base = temp();
  const run = () => {
    mkdirSync(join(checkoutDir(base), "packages/verify/dist/src"), { recursive: true });
    writeFileSync(cliPath(base), "");
  };
  ensureSeaworthy({ base, pin, run });
  const never = () => assert.fail("must not run");
  assert.equal(ensureSeaworthy({ base, pin, run: never }), cliPath(base));

  let rebuilt = 0;
  ensureSeaworthy({ base, pin: { ...pin, commit: "b".repeat(40) }, run: (...args) => (rebuilt++, run(...args)) });
  assert.ok(rebuilt > 0);
  assert.ok(existsSync(cliPath(base)));
});

test("ensureSeaworthy fails when the build leaves no CLI", () => {
  assert.throws(() => ensureSeaworthy({ base: temp(), pin, run: () => {} }), /did not produce/);
});
