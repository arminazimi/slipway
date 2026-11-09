export const id = "unknown-front-matter";
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

/**
 * Gets all properties recursively from a JSON schema and its Ajv instance.
 */
function getValidKeys(schemaInfo) {
  let keys = new Set();
  let visited = new Set();

  function traverse(schema) {
    if (!schema) return;
    // Ajv stores schema objects, sometimes as wrappers or refs
    if (visited.has(schema)) return;
    visited.add(schema);

    if (schema.properties) {
      for (const key of Object.keys(schema.properties)) {
        keys.add(key);
      }
    }
    if (schema.allOf) {
      for (const sub of schema.allOf) {
        traverse(sub);
      }
    }
    if (schema.anyOf) {
      for (const sub of schema.anyOf) {
        traverse(sub);
      }
    }
    if (schema.$ref) {
      // Resolve using schemaInfo.validate.schemaEnv.root.refs or schemaEnv.refs
      try {
        const root = schemaInfo.validate.schemaEnv.root;
        let resolvedEnv = null;

        // Search in refs for exactly the ref string
        if (root.refs && root.refs[schema.$ref]) {
          resolvedEnv = root.refs[schema.$ref];
        } else if (schemaInfo.validate.schemaEnv.refs && schemaInfo.validate.schemaEnv.refs[schema.$ref]) {
          resolvedEnv = schemaInfo.validate.schemaEnv.refs[schema.$ref];
        } else {
          // It might be an internal ref like '#/$defs/...' or an absolute ref ending in one.
          const [base, fragment] = schema.$ref.split('#');
          let baseSchema = schemaInfo.schema;

          if (base) {
            // It could be absolute, look in root.refs or simply search keys that end with base
            if (root.refs && root.refs[base]) {
              baseSchema = root.refs[base].schema;
            } else {
              const matchedKey = Object.keys(root.refs || {}).find(k => k.endsWith(base) || base.endsWith(k));
              if (matchedKey) {
                baseSchema = root.refs[matchedKey].schema;
              }
            }
          }

          if (fragment) {
            let current = baseSchema;
            const parts = fragment.split('/').filter(Boolean);
            for (const part of parts) {
              if (current && current[part]) {
                current = current[part];
              } else {
                current = null;
                break;
              }
            }
            if (current) traverse(current);
          } else if (baseSchema !== schemaInfo.schema) {
            traverse(baseSchema);
          }
          return;
        }

        if (resolvedEnv && resolvedEnv.schema) {
          traverse(resolvedEnv.schema);
        }
      } catch (e) {
        // Just ignore missing refs if they can't be resolved manually here
      }
    }
  }

  traverse(schemaInfo.schema);
  return Array.from(keys);
}

export async function run(site) {
  const findings = [];
  const entries = site.entries("front-matter");
  if (!entries.length) return { status: "pass", findings };

  const schemas = await site.schemas();

  for (const path of site.files()) {
    const fm = site.frontMatterOf(path);
    if (!fm?.data || typeof fm.data !== "object") continue;

    for (const entry of entries) {
      if (site.applies(entry, path)) {
        const schemaInfo = schemas.get(entry.schema);
        if (!schemaInfo?.schema || !schemaInfo?.validate) continue;

        const validKeys = getValidKeys(schemaInfo);

        for (const key of Object.keys(fm.data)) {
          if (!validKeys.includes(key)) {
            const suggestion = closest(key, validKeys);
            findings.push({
              in: "source",
              file: path,
              line: fm.lineOf ? fm.lineOf([key]) + fm.offset : undefined,
              key,
              message: `unknown front matter field \`${key}\`, did you mean \`${suggestion}\`?`,
              fix: `rename ${key} to ${suggestion}`,
            });
          }
        }
        break; // Only use the first matching entry
      }
    }
  }

  return { status: findings.length ? "fail" : "pass", findings };
}
