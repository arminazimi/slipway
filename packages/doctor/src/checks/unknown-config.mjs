import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

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

let cachedSchema = null;
function getSchema() {
  if (!cachedSchema) {
    const path = fileURLToPath(new URL("../../../../schema/slipway-config.schema.json", import.meta.url));
    cachedSchema = JSON.parse(readFileSync(path, "utf8"));
  }
  return cachedSchema;
}

function getValidKeys(schemaNode, prefix = "") {
  let keys = [];
  if (schemaNode?.properties) {
    for (const [key, value] of Object.entries(schemaNode.properties)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      keys.push(currentPath);
      if (value.type === "object" && value.properties) {
        keys = keys.concat(getValidKeys(value, currentPath));
      }
    }
  }
  return keys;
}

function checkConfigData(data, lineOf, file, schemaProps) {
  const findings = [];
  const validKeysAtLevel = Object.keys(schemaProps);

  for (const [key, value] of Object.entries(data)) {
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
      const nestedFindings = checkConfigData(
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

export async function run(site) {
  const schema = getSchema();
  const slipwaySchema = schema.properties.slipway;
  if (!slipwaySchema || !slipwaySchema.properties) return { status: "pass", findings: [] };

  const findings = [];
  for (const name of ["_config.yml", "_config.yaml"]) {
    if (site.isFile(site.source, name)) {
      const parsed = site.dataOf(name);
      if (parsed.data && parsed.data.slipway && typeof parsed.data.slipway === "object") {
        findings.push(
          ...checkConfigData(
            parsed.data.slipway,
            (path) => parsed.lineOf ? parsed.lineOf(["slipway", ...path]) : undefined,
            name,
            slipwaySchema.properties
          )
        );
      }
    }
  }

  return { status: findings.length ? "fail" : "pass", findings };
}
