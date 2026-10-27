import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const usage = `Usage: slipway completion <shell> [options]

Prints a completion script for the given shell (bash, zsh, fish).

Options:
  --json               print as json instead of a shell script
  -h, --help           show this help`;

/** Parses arguments. Returns \`{ options }\` or \`{ error }\`. */
export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "completion") return { error: command ? `unknown command: ${command}` : "missing command" };
  const options = { format: "script", shell: null };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "-h" || arg === "--help") return { help: true };
    else if (arg === "--json") options.format = "json";
    else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
    else if (options.shell === null) options.shell = arg;
    else return { error: `unexpected argument: ${arg}` };
  }
  if (options.shell === null && options.format !== "json") return { error: "missing <shell>" };
  if (options.shell !== null && !["bash", "zsh", "fish"].includes(options.shell)) return { error: `unsupported shell: ${options.shell}. supported: bash, zsh, fish` };
  return { options };
}

async function discoverCommands() {
  const files = readdirSync(__dirname).filter(f => f.endsWith('.mjs'));
  const commands = {};
  for (const file of files) {
    const name = file.slice(0, -4);
    const mod = await import(`./${file}`);
    const flags = [];
    if (mod.usage) {
      const optionLines = mod.usage.split(/Options:/i)[1];
      if (optionLines) {
        for (const match of optionLines.matchAll(/(--[a-zA-Z0-9-]+)/g)) {
          flags.push(match[1]);
        }
      }
    }
    commands[name] = { flags: [...new Set(flags)] };
  }
  return commands;
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway completion: ${parsed.error}\n\n${usage}`);
    return 2;
  }

  const { shell, format } = parsed.options;
  const commands = await discoverCommands();

  if (format === "json") {
    log(JSON.stringify(commands, null, 2));
    return 0;
  }

  const commandNames = Object.keys(commands).join(" ");
  let script = "";

  if (shell === "bash") {
    script = `_slipway_completion() {
  local cur prev words cword cmd
  _init_completion || return

  if [[ $cword -eq 1 ]]; then
    COMPREPLY=( $(compgen -W "${commandNames}" -- "$cur") )
    return 0
  fi

  cmd=\${words[1]}
  case "$cmd" in`;
    for (const [name, info] of Object.entries(commands)) {
      if (info.flags.length > 0) {
        script += `
    ${name})
      COMPREPLY=( $(compgen -W "${info.flags.join(" ")}" -- "$cur") )
      ;;`;
      }
    }
    script += `
  esac
  return 0
}
complete -F _slipway_completion slipway
`;
  } else if (shell === "zsh") {
    script = `#compdef slipway

_slipway() {
  local line state

  _arguments -C \\
    "1: :(${commandNames})" \\
    "*::arg:->args"

  case $line[1] in`;
    for (const [name, info] of Object.entries(commands)) {
      if (info.flags.length > 0) {
        script += `
    ${name})
      _arguments \\
        ${info.flags.map(f => `"${f}"`).join(" \\\n        ")}
      ;;`;
      }
    }
    script += `
  esac
}

_slipway "$@"
`;
  } else if (shell === "fish") {
    script = `function __fish_slipway_no_subcommand
  set -l cmd (commandline -opc)
  if test (count $cmd) -eq 1
    return 0
  end
  return 1
end

complete -c slipway -f\n`;
    for (const name of Object.keys(commands)) {
      script += `complete -c slipway -n '__fish_slipway_no_subcommand' -a ${name}\n`;
    }
    for (const [name, info] of Object.entries(commands)) {
      for (const flag of info.flags) {
        script += `complete -c slipway -n '__fish_seen_subcommand_from ${name}' -l ${flag.replace(/^--/, '')}\n`;
      }
    }
  }

  log(script);
  return 0;
}
