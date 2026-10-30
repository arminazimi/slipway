import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { exitCode, formatFinding, formatText, loadCommands, main, parseArgs, summaryOf, usage } from "../src/cli.mjs";
import * as doctorCommand from "../src/commands/doctor.mjs";

const commandsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "commands");

function capture() {
  const out = [];
  const err = [];
  return { out, err, io: { log: (line) => out.push(String(line)), error: (line) => err.push(String(line)) } };
}

test("every file in src/commands is a command with main, usage, and a summary", async () => {
  const commands = await loadCommands();
  const files = readdirSync(commandsDir).filter((file) => file.endsWith(".mjs")).sort();
  assert.deepEqual(commands.map((command) => command.name), files.map((file) => file.replace(/\.mjs$/, "")));
  assert.ok(commands.some((command) => command.name === "doctor"), "doctor is loaded");
  for (const command of commands) {
    assert.equal(typeof command.module.main, "function", `${command.name} exports main`);
    assert.equal(typeof command.module.usage, "string", `${command.name} exports usage`);
    assert.ok(command.summary, `${command.name} has a one-line summary`);
  }
});

test("summaryOf falls back to the line after Usage:", () => {
  assert.equal(summaryOf({ summary: "one line", usage: "Usage: slipway x\n\nignored" }), "one line");
  assert.equal(summaryOf({ usage: "Usage: slipway x <dir>\n\nDoes the thing.\n\nOptions:" }), "Does the thing.");
  assert.equal(summaryOf({}), "");
});

test("slipway --help lists every command from the folder", async () => {
  const { out, io } = capture();
  assert.equal(await main(["--help"], io), 0);
  const text = out.join("\n");
  assert.match(text, /^Usage: slipway <command> \[options\]/m);
  for (const command of await loadCommands()) assert.match(text, new RegExp(`^  ${command.name}\\s`, "m"));
});

test("slipway with no command prints the same list", async () => {
  const { out, io } = capture();
  assert.equal(await main([], io), 0);
  assert.match(out.join("\n"), /^Commands:$/m);
});

test("a command's --help prints its own usage", async () => {
  const { out, io } = capture();
  assert.equal(await main(["doctor", "--help"], io), 0);
  assert.match(out.join("\n"), /Usage: slipway doctor <source-dir>/);
});

test("an unknown command exits 2 and lists the commands", async () => {
  const { err, io } = capture();
  assert.equal(await main(["nope"], io), 2);
  const text = err.join("\n");
  assert.match(text, /unknown command: nope/);
  assert.match(text, /^  doctor\s/m);
});

test("the doctor command still parses its arguments and returns usage errors", async () => {
  const { err, io } = capture();
  assert.equal(await main(["doctor"], io), 2);
  assert.match(err.join("\n"), /missing <source-dir>/);
});

test("cli re-exports the doctor command's internals for existing callers", () => {
  assert.equal(parseArgs, doctorCommand.parseArgs);
  assert.equal(formatFinding, doctorCommand.formatFinding);
  assert.equal(formatText, doctorCommand.formatText);
  assert.equal(exitCode, doctorCommand.exitCode);
  assert.equal(usage, doctorCommand.usage);
});
