import { realpathSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_DEV_OUT, dev, type DevServer } from "../../../engine/src/cli/dev.ts";
import { resolveThemeRoot } from "../../../engine/src/cli/index.ts";

export const definition = {
  name: "preview",
  description:
    "Run `slipway dev` for the site on a free local port and return its URL. Call it again to restart, or with action \"stop\" to shut the server down.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["start", "stop", "status"],
        default: "start",
        description: "start (default) builds and serves the site; stop shuts the running server down; status reports it.",
      },
    },
    additionalProperties: false,
  },
};

/** The dev server this MCP process started, if any. One per process: a start after a start replaces it. */
let running: DevServer | undefined;
/** Serializes calls, so two starts cannot race and leave one server running unreachable. */
let queue: Promise<unknown> = Promise.resolve();

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function details(server: DevServer) {
  return {
    status: "running" as const,
    url: server.url,
    host: server.host,
    port: server.port,
    out: server.out,
    stop: 'Call preview again with {"action": "stop"} to stop the server; another "start" restarts it.',
  };
}

/**
 * Starts `slipway dev` for `site` on port 0, stops any server a previous call started, and reports the URL. The dev
 * server builds the site once, watches the source for changes, and writes the output under the site, never into
 * anything the site publishes.
 */
export async function preview(site: string, { action = "start" }: { action?: string } = {}) {
  if (action !== "start" && action !== "stop" && action !== "status") {
    throw new Error(`action must be "start", "stop", or "status", not ${action}`);
  }
  return serialized(async () => {
    if (action === "stop") {
      if (running === undefined) return { status: "stopped" as const };
      const stopped = running;
      running = undefined;
      await stopped.close();
      return { status: "stopped" as const, url: stopped.url };
    }
    if (action === "status") {
      return running === undefined ? { status: "stopped" as const } : details(running);
    }

    if (running !== undefined) {
      const previous = running;
      running = undefined;
      await previous.close();
    }

    const root = realpathSync(site);
    const themeRoot = await resolveThemeRoot(root, undefined);
    if (themeRoot === undefined) {
      throw new Error(
        "no theme root: set theme.name in the site config to a folder or package, or keep the theme beside the Slipway package",
      );
    }
    const server = await dev({
      root,
      out: join(root, DEFAULT_DEV_OUT),
      themeRoot,
      defaultLayout: "doc",
      port: 0,
      log: () => {},
    });
    running = server;
    return details(server);
  });
}

export const handler = (site, args) => preview(site, args);
