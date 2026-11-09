import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";

export const id = "unknown-config";
export const level = "warning";

/**
 * Computes the Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Finds the closest string in `options` to `target`.
 */
function closest(target, options) {
  let best = null;
  let minDistance = Infinity;
  for (const option of options) {
    const d = levenshtein(target, option);
    if (d < minDistance) {
      minDistance = d;
      best = option;
    }
  }
  return best;
}

const cache = new Map();

/** Compiles the JSON Schema at `path`, once. */
function validator(path) {
  if (!cache.has(path)) {
    const schema = JSON.parse(readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8"));
    cache.set(path, { schema, validate: new Ajv2020({ allErrors: true, verbose: true, strict: false }).compile(schema) });
  }
  return cache.get(path);
}

/** The engine's site-config schema: the keys of `slipway.yml` (ADR 0024). */
const engineConfig = "../../../../packages/engine/schema/config.schema.json";

/** The 0.2 theme's `slipway:` block in `_config.yml`. */
const legacyConfig = "../../../../schema/slipway-config.schema.json";

/** The segments of an Ajv instance path. */
function instancePath(path) {
  return String(path ?? "")
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => decodeURIComponent(segment));
}

/** An unknown key from an Ajv `additionalProperties` error, with the closest known key as a suggestion. */
function unknownKey(error) {
  const key = String(error.params.additionalProperty ?? error.params.unevaluatedProperty ?? "");
  const path = [...instancePath(error.instancePath), key];
  const valid = Object.keys(error.parentSchema?.properties ?? {});
  const suggestion = valid.length ? closest(key, valid) : null;
  const replacement = suggestion ? [...path.slice(0, -1), suggestion].join(".") : null;
  const dotted = path.join(".");
  return {
    key: dotted,
    message: replacement
      ? `unknown config key \`${dotted}\`, did you mean \`${replacement}\`?`
      : `unknown config key \`${dotted}\``,
    fix: replacement ? `rename ${dotted} to ${replacement}` : `remove ${dotted}`,
    path,
  };
}

/** Unknown keys in an engine site's `slipway.yml`, at their line. */
function checkEngineConfig(configData, config) {
  if (!configData || typeof configData !== "object" || Array.isArray(configData)) return [];
  const { validate } = validator(engineConfig);
  if (validate(configData)) return [];
  return (validate.errors ?? [])
    .filter((error) => error.keyword === "additionalProperties" || error.keyword === "unevaluatedProperties")
    .map((error) => {
      const { path, ...finding } = unknownKey(error);
      return {
        in: "source",
        file: config.file,
        line: config.lineOf ? config.lineOf(path) : 1,
        ...finding,
      };
    });
}

/** Unknown keys under the 0.2 theme's `slipway:` block in `_config.yml`. */
function checkLegacyConfig(data, lineOf, file, schemaProps) {
  const findings = [];
  const validKeysAtLevel = Object.keys(schemaProps);

  for (const [key, value] of Object.entries<any>(data)) {
    if (!validKeysAtLevel.includes(key)) {
      const suggestion = closest(key, validKeysAtLevel);
      findings.push({
        in: "source",
        file,
        line: lineOf([key]),
        key,
        message: `unknown config key \`${key}\`, did you mean \`${suggestion}\`?`,
        fix: `rename ${key} to ${suggestion}`,
      });
    } else if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      schemaProps[key]?.type === "object" &&
      schemaProps[key]?.properties
    ) {
      // Recursively check nested objects like `tokens`
      const nestedFindings = checkLegacyConfig(
        value,
        (path) => lineOf([key, ...path]),
        file,
        schemaProps[key].properties
      );
      findings.push(...nestedFindings);
    }
  }
  return findings;
}

/** The 0.2 `slipway:` block in `_config.yml`, for sites the engine does not build. */
function checkJekyllConfig(site) {
  const { schema } = validator(legacyConfig);
  const slipwaySchema = schema.properties?.slipway;
  if (!slipwaySchema || !slipwaySchema.properties) return [];

  const findings = [];
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (site.isFile(site.source, name)) {
      const parsed = site.dataOf(name);
      if (parsed.data && parsed.data.slipway && typeof parsed.data.slipway === "object") {
        findings.push(
          ...checkLegacyConfig(
            parsed.data.slipway,
            (path) => (parsed.lineOf ? parsed.lineOf(["slipway", ...path]) : undefined),
            name,
            slipwaySchema.properties
          )
        );
      }
    }
  }
  return findings;
}

export async function run(site) {
  const config = site.config();
  const findings = config?.data
    ? checkEngineConfig(config.data, config)
    : checkJekyllConfig(site);

  return { status: findings.length ? "fail" : "pass", findings };
}
