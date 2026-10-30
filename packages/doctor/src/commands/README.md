# Commands

`slipway <command> [options]` loads every `.mjs` file in this folder by file name, in sorted order. Adding a command is adding a file: there is no list to edit. `src/cli.mjs` reads the folder, prints each command in `slipway --help`, and passes the arguments, starting with the command name, to the module's `main`.

## Template

```js
import { resolve } from "node:path";

export const summary = "One line for `slipway --help`.";
export const usage = `Usage: slipway example <source-dir> [options]

What the command does, in one or two sentences.

Options:
  --json               output result as JSON
  -h, --help           show this help`;

/** Parses arguments. Returns `{ options }` or `{ error }`. */
export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "example") return { error: command ? `unknown command: ${command}` : "missing command" };
  const options = { source: null, json: false };
  for (const arg of rest) {
    if (arg === "-h" || arg === "--help") return { help: true };
    else if (arg === "--json") options.json = true;
    else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
    else if (options.source === null) options.source = arg;
    else return { error: `unexpected argument: ${arg}` };
  }
  if (options.source === null) return { error: "missing <source-dir>" };
  return { options };
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway example: ${parsed.error}\n\n${usage}`);
    return 2;
  }
  const source = resolve(parsed.options.source);
  if (parsed.options.json) log(JSON.stringify({ source }, null, 2));
  else log(source);
  return 0;
}
```

## Exports

| Export | Required | Meaning |
| --- | --- | --- |
| `main(args, { log, error })` | yes | Runs the command and returns its exit code. `args` starts with the command name. |
| `usage` | yes | The text for `slipway <command> --help`. |
| `parseArgs(args)` | recommended | Returns `{ options }` or `{ error }`; keep it separate so tests can call it without a process. |
| `id` | no | The command name; the file name is the default. |
| `summary` | no | One line for `slipway --help`; the line after `Usage:` in `usage` is the default. |

Exit codes are the same for every command: `0` success, `1` findings or a failed check, `2` a usage error or a missing folder.

`packages/doctor/test/commands.test.mjs` loads this folder, so a new file needs a callable `main`, a `usage`, and a one-line summary. Add a test next to the command for its behavior.
