// slipway <command> [options]: loads every command in src/commands/ by file name.
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const commandsDir = join(dirname(fileURLToPath(import.meta.url)), "commands");

let cache;

/** One line for `slipway --help`: the module's `summary`, or the description in its usage text. */
export function summaryOf(module) {
  if (module.summary) return module.summary;
  const lines = String(module.usage ?? "").split("\n");
  const start = lines.findIndex((line) => line.startsWith("Usage:"));
  if (start === -1) return "";
  const description = lines.slice(start + 1).find((line) => line.trim());
  return description ? description.trim() : "";
}

/** Every command module in `src/commands/`, sorted by name. */
export async function loadCommands() {
  if (cache) return cache;
  const files = readdirSync(commandsDir).filter((file) => file.endsWith(".mjs")).sort();
  cache = await Promise.all(files.map(async (file) => {
    const module = await import(`./commands/${file}`);
    return { name: module.id ?? file.replace(/\.mjs$/, ""), summary: summaryOf(module), module };
  }));
  return cache;
}

/** The top-level help: one block per command, taken from the folder. */
export function helpText(commands) {
  const width = Math.max(...commands.map((command) => command.name.length));
  const lines = ["Usage: slipway <command> [options]", "", "Commands:"];
  for (const command of commands) {
    lines.push(`  ${command.name.padEnd(width)}  ${command.summary}`.trimEnd());
    lines.push(`  ${" ".repeat(width)}  ${String(command.module.usage ?? "").split("\n")[0]}`);
  }
  lines.push("", "Run `slipway <command> --help` for all of a command's options.");
  return lines.join("\n");
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const [name] = args;
  const commands = await loadCommands();
  if (!name || name === "-h" || name === "--help" || name === "help") {
    log(helpText(commands));
    return 0;
  }
  const command = commands.find((entry) => entry.name === name);
  if (!command) {
    error(`slipway: unknown command: ${name}\n\n${helpText(commands)}`);
    return 2;
  }
  return command.module.main(args, { log, error });
}

export { usage, parseArgs, formatFinding, formatText, exitCode } from "./commands/doctor.mjs";
