import { test } from "node:test";
import assert from "node:assert/strict";
import { main, parseArgs } from "../src/commands/completion.mjs";

function getContext() {
  let stdout = "";
  let stderr = "";
  return {
    log: (msg) => { stdout += msg + "\n"; },
    error: (msg) => { stderr += msg + "\n"; },
    get stdout() { return stdout; },
    get stderr() { return stderr; }
  };
}

test("completion --help", async () => {
  const ctx = getContext();
  const code = await main(["completion", "--help"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /Usage: slipway completion/);
});

test("completion --json", async () => {
  const ctx = getContext();
  const code = await main(["completion", "--json"], ctx);
  assert.equal(code, 0);
  const info = JSON.parse(ctx.stdout);
  assert.ok(info.info);
  assert.ok(info.info.flags.includes("--build"));
  assert.ok(info.completion);
  assert.ok(info.completion.flags.includes("--json"));
});

test("completion with bash shell", async () => {
  const ctx = getContext();
  const code = await main(["completion", "bash"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /_slipway_completion\(\)/);
  assert.match(ctx.stdout, /COMPREPLY=/);
});

test("completion with zsh shell", async () => {
  const ctx = getContext();
  const code = await main(["completion", "zsh"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /#compdef slipway/);
  assert.match(ctx.stdout, /_arguments/);
});

test("completion with fish shell", async () => {
  const ctx = getContext();
  const code = await main(["completion", "fish"], ctx);
  assert.equal(code, 0);
  assert.match(ctx.stdout, /function __fish_slipway_no_subcommand/);
  assert.match(ctx.stdout, /complete -c slipway -f/);
});

test("completion with unsupported shell", async () => {
  const ctx = getContext();
  const code = await main(["completion", "csh"], ctx);
  assert.equal(code, 2);
  assert.match(ctx.stderr, /unsupported shell: csh/);
});

test("completion parseArgs errors", () => {
  assert.equal(parseArgs(["completion"]).error, "missing <shell>");
  assert.equal(parseArgs(["x"]).error, "unknown command: x");
  assert.equal(parseArgs(["completion", "bash", "--foo"]).error, "unknown option: --foo");
  assert.equal(parseArgs(["completion", "bash", "zsh"]).error, "unexpected argument: zsh");
});
