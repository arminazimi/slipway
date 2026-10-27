import { realpathSync } from "node:fs";
import { exitCode } from "../../../doctor/src/cli.mjs";
import { doctor, levels } from "../../../doctor/src/doctor.mjs";
import { insideSite } from "../tools.mjs";

export const definition = {
  name: "doctor",
  description:
    "Run slipway doctor on the site: check its source and, with build, its built output against the agent-editable site spec. Returns ok, the level reached, and every finding with its file, line, and fix. Run it after each edit and fix what it finds. Never uses the network.",
  inputSchema: {
    type: "object",
    properties: {
      build: { type: "string", description: "The built output folder, relative to the site directory (such as _site). Without it, the tests on the output fail." },
      level: { type: "string", enum: levels, description: "ok is true when the site reaches this level. Without it, ok is true when every MUST test passes." },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
};

/**
 * `slipway doctor` on the site, with `build` as the output folder inside it. Returns the doctor's JSON report with
 * `ok` and `target` first: `ok` follows the CLI's exit code, true when the site reaches `level`, or with no level
 * when every MUST test passes. Never uses the network.
 */
export async function runDoctor(site, { build, level } = {}) {
  if (level !== undefined && !levels.includes(level)) throw new Error(`level must be one of ${levels.join(", ")}`);
  const report = await doctor(realpathSync(site), { build: build === undefined ? null : insideSite(site, build) });
  return { ok: exitCode(report, level) === 0, target: level ?? null, ...report };
}

export const handler = (site, args) => runDoctor(site, args);
