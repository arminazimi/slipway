/** `mizzen build`, `mizzen check`, `mizzen dev`, `mizzen verify`, and `mizzen watch`: build a site, report diagnostics, serve it while developing, check a build, or rebuild on change (ADR 0025). */
import { access, mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { availableParallelism, tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config/load.ts";
import { version } from "../index.ts";
import { build } from "../pipeline/build.ts";
import { formatJson, formatSarif, formatText } from "../pipeline/diagnostics.ts";
import { DEFAULT_DEV_HOST, DEFAULT_DEV_OUT, DEFAULT_DEV_PORT, dev } from "./dev.ts";
import { verify, verifyMessage } from "./verify.ts";
import { DEFAULT_WATCH_OUT, watch as watchSite } from "./watch.ts";

/** The command name on the PATH (ADR 0025). */
export const NAME = "mizzen";

const FORMATS = ["text", "json", "sarif"] as const;
type Format = (typeof FORMATS)[number];

/** Layout used when a page names none and the site's defaults name none. */
const DEFAULT_LAYOUT = "doc";

/** Folder of the theme that ships beside this package in the monorepo (`packages/theme`). */
const SIBLING_THEME = fileURLToPath(new URL("../../../theme", import.meta.url));

export const usage = `Usage: ${NAME} <command> [dir] [options]

Commands:
  build [dir]   Build the site into --out (default: dist)
  check [dir]   Build to a temp folder and print diagnostics only
  dev [dir]     Serve the site, rebuild on change, and reload the browser
  verify [dir]  Check a built folder against the hash in its manifest
  watch [dir]   Rebuild the site whenever a source or theme file changes

Options:
  --out <dir>          Output folder: build (default: dist), dev (default: .slipway/dev), watch (default: .slipway/watch)
  --theme <dir>        Theme root folder (layouts/, chrome/, components/)
  --format <format>    text, json, or sarif (check only; default: text)
  --hash <hex>         Expected build hash for verify (default: the manifest's)
  --port <number>      Port for dev (default: 3000; 0 picks a free one)
  --host <host>        Host for dev (default: 127.0.0.1)
  --workers <n|auto>   Render pages in n worker threads; auto is the CPU count minus one (default: 1)
  -h, --help           Show this help

Exit codes: 0 ok, 1 errors, 2 usage.`;

export type Io = {
  readonly log?: (message: string) => void;
  readonly error?: (message: string) => void;
};

type BuildOpts = {
  readonly command: "build";
  readonly root: string;
  readonly out: string;
  readonly theme?: string;
  readonly workers?: number;
};

type CheckOpts = {
  readonly command: "check";
  readonly root: string;
  readonly format: Format;
  readonly theme?: string;
  readonly workers?: number;
};

type DevOpts = {
  readonly command: "dev";
  readonly root: string;
  readonly out?: string;
  readonly port: number;
  readonly host: string;
  readonly theme?: string;
};

type VerifyOpts = {
  readonly command: "verify";
  readonly root: string;
  readonly hash?: string;
};

type WatchOpts = {
  readonly command: "watch";
  readonly root: string;
  readonly out?: string;
  readonly theme?: string;
};

type Parsed =
  | { readonly help: true }
  | { readonly error: string }
  | { readonly options: BuildOpts | CheckOpts | DevOpts | VerifyOpts | WatchOpts };

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Resolves a theme package name from `from` (a folder that may hold node_modules). */
function resolvePackage(name: string, from: string): string | undefined {
  try {
    const require = createRequire(join(from, "package.json"));
    return dirname(require.resolve(`${name}/package.json`));
  } catch {
    try {
      const require = createRequire(join(from, "noop.js"));
      return dirname(require.resolve(`${name}/package.json`));
    } catch {
      return undefined;
    }
  }
}

/**
 * Picks the theme root: `--theme`, then `theme.name` in the site config (path or package),
 * then the sibling `theme` folder beside this package when it exists.
 */
export async function resolveThemeRoot(siteRoot: string, themeFlag: string | undefined): Promise<string | undefined> {
  if (themeFlag !== undefined) return resolve(themeFlag);

  const { config } = loadConfig(siteRoot);
  const name = config.theme.name;
  if (name !== undefined && name.length > 0) {
    if (name.startsWith(".") || name.startsWith("/") || isAbsolute(name)) {
      return resolve(siteRoot, name);
    }
    if (await exists(resolve(siteRoot, name))) return resolve(siteRoot, name);
    const fromSite = resolvePackage(name, siteRoot);
    if (fromSite !== undefined) return fromSite;
    const fromCwd = resolvePackage(name, process.cwd());
    if (fromCwd !== undefined) return fromCwd;
    return undefined;
  }

  if (await exists(SIBLING_THEME)) return SIBLING_THEME;
  return undefined;
}

/** Parses `argv` after the process name. */
export function parseArgs(args: readonly string[]): Parsed {
  const [command, ...rest] = args;
  if (command === undefined || command === "-h" || command === "--help" || command === "help") {
    return { help: true };
  }
  if (command !== "build" && command !== "check" && command !== "dev" && command !== "verify" && command !== "watch") {
    return { error: `unknown command: ${command}` };
  }

  let root: string | undefined;
  let out: string | undefined;
  let theme: string | undefined;
  let format: Format = "text";
  let hash: string | undefined;
  let port: number = DEFAULT_DEV_PORT;
  let host: string = DEFAULT_DEV_HOST;
  let workers: number | undefined;

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i]!;
    const value = (): string => {
      const next = rest[++i];
      if (next === undefined || next.startsWith("-")) throw new Error(`${arg} needs a value`);
      return next;
    };
    try {
      if (arg === "-h" || arg === "--help") return { help: true };
      if (arg === "--out") {
        if (command !== "build" && command !== "dev" && command !== "watch") {
          return { error: "--out is only valid for build, dev, and watch" };
        }
        out = value();
      } else if (arg === "--theme") {
        if (command === "verify") return { error: "--theme is only valid for build, check, dev, and watch" };
        theme = value();
      } else if (arg === "--format") {
        if (command !== "check") return { error: "--format is only valid for check" };
        const raw = value();
        if (!FORMATS.includes(raw as Format)) {
          return { error: `--format must be text, json, or sarif, not ${raw}` };
        }
        format = raw as Format;
      } else if (arg === "--hash") {
        if (command !== "verify") return { error: "--hash is only valid for verify" };
        const raw = value();
        if (!/^[0-9a-f]{64}$/.test(raw)) {
          return { error: `--hash must be 64 lowercase hexadecimal characters, not ${raw}` };
        }
        hash = raw;
      } else if (arg === "--port") {
        if (command !== "dev") return { error: "--port is only valid for dev" };
        const raw = value();
        const parsed = Number(raw);
        if (!/^\d+$/.test(raw) || !Number.isInteger(parsed) || parsed > 65535) {
          return { error: `--port must be a whole number from 0 to 65535, not ${raw}` };
        }
        port = parsed;
      } else if (arg === "--host") {
        if (command !== "dev") return { error: "--host is only valid for dev" };
        host = value();
      } else if (arg === "--workers") {
        if (command !== "build" && command !== "check") return { error: "--workers is only valid for build and check" };
        const raw = value();
        if (raw === "auto") {
          workers = Math.max(1, availableParallelism() - 1);
        } else {
          const parsed = Number(raw);
          if (!/^\d+$/.test(raw) || !Number.isInteger(parsed) || parsed < 1) {
            return { error: `--workers must be a whole number of at least 1, or auto, not ${raw}` };
          }
          workers = parsed;
        }
      } else if (arg.startsWith("-")) {
        return { error: `unknown option: ${arg}` };
      } else if (root === undefined) {
        root = arg;
      } else {
        return { error: `unexpected argument: ${arg}` };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  const dir = root ?? ".";
  if (command === "build") {
    return {
      options: {
        command: "build",
        root: dir,
        out: out ?? "dist",
        ...(theme === undefined ? {} : { theme }),
        ...(workers === undefined ? {} : { workers }),
      },
    };
  }
  if (command === "dev") {
    return {
      options: {
        command: "dev",
        root: dir,
        ...(out === undefined ? {} : { out }),
        port,
        host,
        ...(theme === undefined ? {} : { theme }),
      },
    };
  }
  if (command === "verify") {
    return {
      options: {
        command: "verify",
        root: dir,
        ...(hash === undefined ? {} : { hash }),
      },
    };
  }
  if (command === "watch") {
    return {
      options: {
        command: "watch",
        root: dir,
        ...(out === undefined ? {} : { out }),
        ...(theme === undefined ? {} : { theme }),
      },
    };
  }
  return {
    options: {
      command: "check",
      root: dir,
      format,
      ...(theme === undefined ? {} : { theme }),
      ...(workers === undefined ? {} : { workers }),
    },
  };
}

function printDiagnostics(
  diagnostics: Parameters<typeof formatText>[0],
  format: Format,
  log: (message: string) => void,
): void {
  if (format === "json") log(formatJson(diagnostics).replace(/\n$/, ""));
  else if (format === "sarif") {
    log(
      formatSarif(diagnostics, {
        tool: { name: NAME, version },
      }).replace(/\n$/, ""),
    );
  } else log(formatText(diagnostics).replace(/\n$/, ""));
}

/** Runs the CLI. Returns the exit code. */
export async function main(args: readonly string[], io: Io = {}): Promise<number> {
  const log = io.log ?? console.log;
  const error = io.error ?? console.error;

  const parsed = parseArgs(args);
  if ("help" in parsed) {
    log(usage);
    return 0;
  }
  if ("error" in parsed) {
    error(`${NAME}: ${parsed.error}\n\n${usage}`);
    return 2;
  }

  const { options } = parsed;

  if (options.command === "verify") {
    try {
      const result = await verify({
        dir: options.root,
        ...(options.hash === undefined ? {} : { hash: options.hash }),
      });
      if (result.ok) {
        log(verifyMessage(result));
        return 0;
      }
      error(`${NAME}: ${verifyMessage(result)}`);
      return 1;
    } catch (err) {
      error(`${NAME}: ${err instanceof Error ? err.message : String(err)}`);
      return 2;
    }
  }

  const root = resolve(options.root);
  const themeRoot = await resolveThemeRoot(root, options.theme);
  if (themeRoot === undefined) {
    error(
      `${NAME}: no theme root. Pass --theme <dir>, or set theme.name in the site config to a folder or package.\n\n${usage}`,
    );
    return 2;
  }

  if (options.command === "dev") {
    // A default --out stays inside the site (and hidden, so discovery skips it); an explicit one is from the cwd.
    const out = options.out === undefined ? join(root, DEFAULT_DEV_OUT) : resolve(options.out);
    try {
      const server = await dev({
        root,
        out,
        themeRoot,
        defaultLayout: DEFAULT_LAYOUT,
        port: options.port,
        host: options.host,
        log,
      });
      log(`mizzen dev: serving ${server.url}`);
      const stop = (): void => {
        void server.close();
      };
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
      try {
        await server.closed;
      } finally {
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
      }
      return 0;
    } catch (err) {
      error(`${NAME}: ${err instanceof Error ? err.message : String(err)}`);
      return 2;
    }
  }

  if (options.command === "watch") {
    // A default --out stays inside the site (and hidden, so discovery skips it); an explicit one is from the cwd.
    const out = options.out === undefined ? join(root, DEFAULT_WATCH_OUT) : resolve(options.out);
    try {
      const watcher = await watchSite({
        root,
        out,
        themeRoot,
        defaultLayout: DEFAULT_LAYOUT,
        cache: true,
        log,
      });
      log(`mizzen watch: watching ${root} and ${themeRoot}; press Ctrl-C to stop`);
      // SIGINT is process-level; stopping twice is safe, so a second signal while a build is in flight still exits.
      const stop = (): void => {
        void watcher.stop();
      };
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
      try {
        await watcher.closed;
      } finally {
        process.off("SIGINT", stop);
        process.off("SIGTERM", stop);
      }
      return 0;
    } catch (err) {
      error(`${NAME}: ${err instanceof Error ? err.message : String(err)}`);
      return 2;
    }
  }

  if (options.command === "build") {
    // --out is resolved from the current working directory, not the site root.
    const out = resolve(options.out);
    try {
      const result = await build({
        root,
        out,
        themeRoot,
        defaultLayout: DEFAULT_LAYOUT,
        cache: true,
        ...(options.workers === undefined ? {} : { workers: options.workers }),
      });
      if (result.diagnostics.length > 0) printDiagnostics(result.diagnostics, "text", log);
      return result.diagnostics.some((d) => d.severity === "error") ? 1 : 0;
    } catch (err) {
      error(`${NAME}: ${err instanceof Error ? err.message : String(err)}`);
      return 2;
    }
  }

  const stagingParent = await mkdtemp(join(tmpdir(), "mizzen-check-"));
  const out = join(stagingParent, "out");
  try {
    const result = await build({
      root,
      out,
      themeRoot,
      defaultLayout: DEFAULT_LAYOUT,
      ...(options.workers === undefined ? {} : { workers: options.workers }),
    });
    printDiagnostics(result.diagnostics, options.format, log);
    return result.diagnostics.some((d) => d.severity === "error") ? 1 : 0;
  } catch (err) {
    error(`${NAME}: ${err instanceof Error ? err.message : String(err)}`);
    return 2;
  } finally {
    await rm(stagingParent, { recursive: true, force: true });
  }
}
