# Examples

Units that run a site's recorded code examples and report whether they passed. The engine runs them while it builds so a page can say its examples were tested.

This folder is not a registry: nothing lists its files, so a unit is added or deleted on its own and no shared index changes.

| Unit | What it does |
| --- | --- |
| `run-node.ts` | Runs one `js`, `mjs`, or `ts` snippet in a child process and returns `{ ok, exitCode, stdout, stderr, durationMs, timedOut }`. |

## `run-node.ts`

`runNodeExample({ code, lang, timeoutMs?, env?, cwd? })` writes the snippet into a new `mkdtemp` folder — with a `package.json` marking `js`/`mjs` as ES modules, and with `ts` relying on Node's native type stripping — and spawns `process.execPath` there. `HOME` and `TMPDIR` point inside the same folder; the environment is otherwise only `PATH`, `LANG=C.UTF-8`, and `NO_COLOR=1`, plus whatever the caller passes in `env`. Output is captured up to 64 KiB per stream. When `timeoutMs` expires (10 seconds by default) the whole process group is killed with `SIGKILL`. The temp folder is removed before the function returns, in every outcome. A failing, noisy, or hanging example is a result; the function throws only for a caller's mistake (an unknown `lang` or a non-positive `timeoutMs`).

The runner is a **process sandbox, not an OS sandbox**. The example runs as the engine's user with the engine's file permissions, so an absolute path, the network, or a process that leaves the group is still reachable. It promises a clean start, a bounded run, and cleanup — not isolation from the host.

## Adding a unit

Add `run-<tool>.ts` beside this file that exports one function taking the snippet and options and returning the same result shape, and add its tests in `packages/engine/test/run-<tool>.test.ts`. Units here do not register anywhere; the output or page that uses them imports them directly.
